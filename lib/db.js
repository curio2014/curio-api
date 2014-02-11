var co = require('co')
var _ = require('./utils')
var conf = require_('conf')
var debug = require('debug')('curio:db')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var redisc = require('./redis')({
  database: 'curio.dbstore',
  prefix: 'curio:dbstore:',
  ttl: null,
})
var schemaOptions = _.clone(conf.postgres)

schemaOptions.log = conf.debug

var db = new Schema('postgres', schemaOptions)
var _ = require('./utils')

// Add hooks
Model.afterInitialize = function() {
  var self = this
  var defaults = self.constructor._cprops_default
  if (defaults !== undefined && !self.hasOwnProperty('_cprops')) {
    var props = {}
    hiddenProperty(self, '_cprops', props)
    _.forEach(defaults, function(dft, name) {
      Object.defineProperty(self, name, {
        enumerable: true,
        get: function() {
          if (props.hasOwnProperty(name)) return props[name]
          return defaults[name]
        },
        set: function(value) {
          props[name] = value
        }
      })
    })
  }
}

Model.beforeCreate = function(next) {
  var self = this
  if (this.hasColumn('created_at')) {
    this.created_at = new Date;
  }
  next()
}

Model.beforeSave = function(next) {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date;
  }
  if (this.hasOwnProperty('_cprops')) {
    co(function *() {
      yield self.saveProps()
      next()
    })()
  } else {
    next()
  }
}



/**
 * Register key-value stored properties
 */
Model.registerProps = function registerProps(props) {
  var names = Object.keys(props)
  var values = names.map(function(item) {
    var hasDefault = props[item] && props[item].hasOwnProperty('default')
    return hasDefault ? props[item].default : null
  })
  var defaults = _.zipObject(names, values)
  Object.defineProperty(this, '_cprops_default', {
    enumerable: false,
    writable: false,
    value: defaults
  })
}

/**
 * Get by id(number) or uid(string)
 */
Model.get = function getOne(id) {
  if (id == null) {
    throw new Error('Model.get id cannot be null')
  }
  if (isdigit(id)) return this.find(id)
  return this.findOne({where: {uid: id}})
}


// Searchable fields, and their default ordering
Model.scolumns = {
  'created_at': 'desc',
  'updated_at': 'desc'
}

Model.DEFAULT_LIMIT = 20
Model.queryValidator = {
  // jugglingdb use `skip`, we use offset
  offset: function(q) {
    return Number(q.offset)
  },
  limit: function(q) {
    return Number(q.limit)
  },
  where: function(q, opts) {
    var fields = this.scolumns
    var k, order, where
    for (k in fields) {
      order = fields[k]
      if (q[k]) {
        where = where || {}
        where[k] = q[k]
        // has a default order
        if (order && !opts.order) {
          opts.order = k + ' ' + order
        }
      }
    }
    return where
  }
}

/**
 * Format database safe query string from url parameters
 */
Model.safeQuery = function safeQuery(query) {
  if (!query) return
  var opts = {}
  var k, r, validator = this.queryValidator
  if (typeof validator == 'function') {
    return validator(query, opts)
  }
  for (k in validator) {
    r = validator[k].call(this, query, opts)
    // null, 0, '' are allowed
    if (r !== undefined && !isNaN(r)) {
      opts[k] = r
    }
  }
  if (opts.limit === undefined) {
    // give a default query limit
    opts.limit = Model.DEFAULT_LIMIT
  }
  if (!opts.where) {
    // default sort order is ID desc
    opts.order = opts.order || 'id desc'
  }
  return opts
}

Model.prototype.uuid = function() {
  return this.constructor.modelName + ':' + this.id
}

Model.prototype.hasColumn = function(name) {
  return this.constructor.properties.hasOwnProperty(name)
}


/**
 * skip dbstore props when toObject
 */
var _toObject = Model.prototype.toObject
Model.prototype.toObject = function(onlySchema) {
  var result = _toObject.call(this, onlySchema)
  if (!onlySchema) {
    _.assign(result, this._cprops)
  }
  return result
}

Model.prototype.loadProps = function(props) {
  if (!this.hasOwnProperty('_cprops')) {
    throw new Error('use Model.registerProps to add some props first')
  }
  _.assign(this._cprops, props)
}

Model.prototype.fetchProps = function() {
  var self = this;
  return function *fetchProps() {
    this.loadProps(yield redisc.get(self.uuid()))
  }
}

Model.prototype.saveProps = function saveProps(props) {
  if (props) {
    this.loadProps(props)
  }
  return redisc.set(this.uuid(), this._cprops)
}
Model.prototype.clearProps = function *clearProps() {
  for (var k in this._cprops) {
    delete this._cprops[k]
  }
  return yield redisc.destroy(this.uuid())
}

// make all the callback method yieldable
;['create', 'count', 'all', 'find', 'findOne'].forEach(function(name, i) {
  thunkify(Model, name)
})
;['save', 'updateAttributes', 'updateAttribute', 'destroy'].forEach(function(name, i) {
  thunkify(Model.prototype, name)
})

Model.upsert_ = Model.upsert
Model.upsert = function(uid, props) {
  var self = this
  if (isdigit(uid)) {
    props.id = uid
    return function(next) {
      debug('%s.upsert %j', self.modelName, props)
      self.upsert_(props, next)
    }
  }
  return function *() {
    var item = yield self.get(uid)
    if (item) {
      return yield item.updateAttributes(props)
    }
    props.uid = uid
    return yield self.create(props)
  }
}

// How to get a related property object
Model.fetcher = {
  'props': function *() {
    return yield this.fetchProps()
  }
}

Model.mfetcher = {
  'props': function *(items) {
    var uuids = items.map(function(item) { return item.uuid() })
    // get all props
    var allProps = yield redisc.mget(uuids)
    items.forEach(function(item, i) {
      if (allProps[i]) {
        // load properties
        item.loadProps(allProps[i])
      }
    })
    return items
  }
}

function thunkify(Model, name) {
  var fn = Model[name + '_'] = Model[name]
  Model[name] = function() {
    var args = Array.prototype.slice.call(arguments)
    var self = this;
    var hasProps = self.hasOwnProperty('_cprops_default')
    // when callback provided, run as normal async method
    if (typeof args[args.length-1] === 'function') {
      return fn.apply(self, args)
    }
    //if (name == 'all' || name == 'findOne') {
      //args = flattenQuery.apply(self, args)
    //}

    function runner(cb) {
      debug('%s.%s %j', self.modelName || self.uuid(), name, args)
      args.push(cb)
      fn.apply(self, args)
    }

    // attach more async objects
    runner.attach = function(prop) {
      fetcher = Model.fetcher[prop]
      mfetcher = Model.mfetcher[prop]

      return function(cb) {
        co(function *() {
          var result = yield runner
          if (Array.isArray(result)) {
            if (mfetcher) {
              result = yield mfetcher(result)
            } else {
              result = yield result.map(function(item, i) {
                return fetcher.call(item, i)
              })
            }
          } else {
            result = fetcher.call(result)
          }
          cb(null, result)
        })()
      }
    }

    // use Model.include to build a `join` query
    runner.include = function(opt) {
      args[0].include = opt
      return runner
    }

    return runner
  }
}

// more reasonable param handling
function flattenQuery(query, param) {
  if (!param) {
    param = { where: query }
  } else {
    param.where = query
  }
  // default is always order by id
  if (!param.hasOwnProperty('order')) {
    param.order = 'id DESC'
  }
  return [param]
}

function isdigit(text) {
  return !isNaN(Number(text))
}

function hiddenProperty(where, property, value) {
  Object.defineProperty(where, property, {
    writable: false,
    enumerable: false,
    configurable: false,
    value: value
  });
}


module.exports = db
