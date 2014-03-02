var __slice = Array.prototype.slice
var thunkify = require('thunkify')
var co = require('co')
var _ = require('./utils')
var conf = require_('conf')
var debug = require_('lib/utils/logger').debug('db')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var store = require_('lib/store')('cprops')
var schemaOptions = _.clone(conf.postgres)

schemaOptions.log = conf.debug

var db = new Schema('postgres', schemaOptions)
var _ = require('./utils')


// A yieldable query function
db.adapter.execute = thunkify(db.adapter.query)


// Add hooks
Model.afterInitialize = function() {
  var self = this
  var defaults = self._cprops_default
  if (defaults && !self.hasOwnProperty('_cprops')) {
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
  if (this.hasColumn('created_at') && !this.created_at) {
    this.created_at = new Date;
  }
  next()
}

Model.beforeSave = function(next) {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date;
  }
  co(function *() {
    yield self.dump()
    next()
  })()
}

Model.afterSave = function(next) {
  this._clearCache(next)
}

Model.afterDestroy = function(next) {
  this._clearCache(next)
}


/**
 * Register key-value stored properties
 */
Model.registerProps = function registerProps(props) {
  var defaults = {}
  for (var k in props) {
    defaults[k] = props[k] && props[k].default || props[k]
  }
  Object.defineProperty(this.prototype, '_cprops_default', {
    enumerable: false,
    writable: false,
    value: defaults
  })
}

Model.getOne = function getOne(id) {
  if ('object' == typeof id) {
    if (Object.keys(id).length == 1 && 'id' in id) {
      return this.get(id.id)
    }
  }
  return this.findOne({ where: id })
}

/**
 * Get by id(number) or uid(string)
 */
Model.get = function get(id, callback) {
  if (id == null) {
    throw new Error('Model.get id cannot be null')
  }
  // empty id is empty (including zero)
  if (!id) {
    return null
  }
  if (isdigit(id)) {
    return this.find(id, callback)
  }
  return this.findOne({where: {uid: id}}, callback)
}
Model.gets = function getAll(ids, callback) {
  return this.all({
    where: { id: { inq: ids } }
  }, callback)
}


// Searchable fields, and their default ordering
Model.scolumns = {
}


Model.defaultLimit = 20
Model.defaultOrder = null
Model.queryValidator = {
  // jugglingdb use `skip`, we use offset
  offset: function(q) {
    return Number(q.offset)
  },
  limit: function(q) {
    return Number(q.limit)
  },
  order: function(q) {
    // in case of `?order=abc%20asc&order=foo%20desc` (when order is Array)
    var order = q.order && q.order.toString().split(',').join(' ')
    return order || this.defaultOrder
  },
  where: function(q, opts) {
    var fields = this.scolumns
    var k, order, where
    for (k in fields) {
      // the default order is setted in scolumns
      order = fields[k]
      if (q[k]) {
        // query setted this query
        where = where || {}
        // update where statement with query value
        where[k] = this.safeValue(k, q[k])
      }
      // when query opts don't have a order
      if (order && !opts.order) {
        opts.order = k + ' ' + order
      }
    }
    return where
  }
}

Model.safeValue = function safeValue(k, value) {
  if (this.setter[k]) {
    var obj = {}
    this.setter[k].call(obj, value)
    return obj[k] || obj['_' + k]
  }
  return value
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
    if (r === undefined || (isNaN(r) && 'number' == typeof r)) {
      continue
    }
    opts[k] = r
  }
  if (opts.limit === undefined) {
    // give a default query limit
    opts.limit = Model.defaultLimit
  }
  if (!opts.where) {
    // default sort order is ID desc
    opts.order = opts.order || 'id desc'
  }
  return opts
}

/**
 * A yieldable Array for parallel action
 */
Model.parallel = function(methodName, items) {
  var self = this
  var fn = self[methodName]
  if (!fn) {
    throw new Error('unsupported method: ' + methodName)
  }
  return items.map(function(item) {
    return fn.call(self, item)
  })
}

Model.prototype.uuid = function() {
  return this.constructor.modelName + ':' + (this.id || '[new]')
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

/**
 * Fake method of clear cache
 */
Model.prototype._clearCache = function(next) {
  next && next()
}


Model.upsert_ = Model.upsert
Model.upsert = function(uid, props) {
  var self = this
  if (isdigit(uid)) {
    props = props || {}
    props.id = uid
    return function(next) {
      debug('%s.upsert %j', self.modelName, props)
      self.upsert_(props, next)
    }
  }
  return function *() {
    var item = yield self.findOne({where: { uid: uid }})
    if (item) {
      return yield item.updateAttributes(props)
    }
    props.uid = uid
    item = yield self.create(props)
    return item
  }
}

/**
 * Create a finder for one or more property
 *
 * Examples:
 *
 *    Model.findByUser = Model.finder('user_id')
 *    Model.getByAandB = Model.finder('a', 'b', onlyOne=true)
 */
Model.finder = function() {
  var props = __slice.call(arguments)
  var onlyOne = false
  if ('string' != typeof props[props.length-1]) {
    onlyOne = props.pop()
  }
  var len = props.length
  var methodName = onlyOne ? 'findOne': 'all'
  return function findByProp() {
    var args, options
    args = __slice.call(arguments)
    if (args.length < len) {
      throw new Error('All arguments are required: ' + props.join(', '))
    }
    if ('object' == typeof args[args.length-1]) {
      options = args.pop()
    }
    options = options || {}
    options.where = options.where || {}
    props.forEach(function(item, i) {
      var val = args[i]
      if (val === undefined) {
        val = null
      }
      options.where[item] = val
    })
    return this[methodName](options)
  }
}

Model.upsertBy = function() {
  var props = __slice.call(arguments)
  return function *upsertByProps() {
    var args, data, item
    args = __slice.call(arguments)
    if (args.length > props.length) {
      data = args.pop()
      args = args.slice(0, props.length)
    }
    var query = _.zipObject(props, args)
    item = yield this.findOne({ where: query })

    // alreay in database
    if (item) {
      if (data) {
        //for (var k in data) {
          //if (data[k] == item[k]) {
            //delete data[k]
          //}
        //}
        yield item.updateAttributes(data)
      }
      return item
    }

    data = data || {}
    props.forEach(function(item, i) {
      data[item] = args[i]
    })

    return yield this.create(data)
  }
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
    this.loadProps(yield store.get(self.uuid()))
  }
}

Model.prototype.saveProps = function saveProps(props) {
  if (props) {
    this.loadProps(props)
  }
  return store.set(this.uuid(), this._cprops)
}
Model.prototype.clearProps = function *clearProps() {
  for (var k in this._cprops) {
    delete this._cprops[k]
  }
  return yield store.del(this.uuid())
}


 /**
  * define How to get a related property object
  * must return a yialdable object
 */
Model.fetcher = {
  'props': function *() {
    return yield this.fetchProps()
  }
}

Model.mfetcher = {
  'props': function *(items) {
    if (!items.length) {
      return []
    }
    var uuids = items.map(function(item) { return item.uuid() })
    // get all props
    var allProps = yield store.mget(uuids)
    items.forEach(function(item, i) {
      if (allProps[i]) {
        // load properties
        item.loadProps(allProps[i])
      }
    })
    return items
  }
}

Model.putter = {
  'props': function *() {
    if (!this.hasOwnProperty('_cprops')) {
      return
    }
    yield this.saveProps()
  }
}

/**
 * Load a remote property via fetcher
 */
Model.prototype.load = function *(prop) {
  var self = this
  var fetcher = self.constructor.fetcher[prop]
  var other_args = __slice.call(arguments, 1)
  if (!fetcher && self[prop]) {
    if (_.isGeneratorFunction(self[prop])) {
      fetcher = self[prop]
    } else {
      // fetch from jugglingdb relations
      fetcher = function() {
        return function(cb) {
          other_args.push(cb)
          self[prop].apply(self, other_args)
        }
      }
    }
  }
  if (!fetcher) {
    throw new Error('dont know how to load "' + prop +
      '" for ' + self.constructor.modelName)
  }
  self[prop] = yield fetcher.apply(self, other_args)
  return self
}

/**
 * Put a remote attribute with putter
 */
Model.prototype.dump = function *(prop) {
  var self = this, putter, data
  if (!prop) {
    // save all props
    for (var prop in self.constructor.putter) {
      yield self.dump(prop)
    }
    return
  }
  putter = self.constructor.putter[prop]
  data = self[prop]
  if (prop && typeof data != 'function') {
    debug('Put a remote property "%s"', prop)
    yield putter.call(self, data)
  }
}

/**
 * Validate attributes
 */
Model.prototype.validate = function (data) {
  var self = this
  return function(next) {
    return self.isValid(function(result) {
      next(null, result)
    }, data)
  }
}

Model.canAttach = function(name) {
  return this.fetcher.hasOwnProperty(name) || this.prototype.hasOwnProperty(name)
}

// make all the callback method yieldable
;['create', 'count', 'destroyAll', 'get', 'gets', 'all', 'find', 'findOne'].forEach(function(name, i) {
  _thunkify(Model, name, i > 2)
})
;['save', 'updateAttributes', 'updateAttribute', 'destroy'].forEach(function(name, i) {
  _thunkify(Model.prototype, name, false)
})

function _thunkify(Model, name, isRead) {

  Model[name + '_'] = Model[name]
  Model[name] = function() {
    var args = Array.prototype.slice.call(arguments)
    var self = this
    var fn = self[name + '_'] // the raw callback style function
    var result

    // when callback provided, run as normal async method
    if (typeof args[args.length-1] === 'function') {
      return fn.apply(self, args)
    }

    function runner(cb) {
      if (result) {
        // dont run twice
        return cb(null, result)
      }
      debug('%s.%s %j', self.modelName || self.uuid(), name, args)
      args.push(cb)
      fn.apply(self, args)
    }

    if (isRead) {
      // attach more async objects
      function attach(prop) {
        if (Array.isArray(prop)) {
          var ret = runner, name
          while (prop.length) {
            name = prop.shift()
            ret = ret.attach(name)
          }
          return ret
        }

        var mfetcher = self.mfetcher[prop]
        var fn = function(cb){
          co(function *() {
            // fetch main query result first
            result = result || (yield runner)
            if (Array.isArray(result)) {
              if (mfetcher) {
                result = yield mfetcher.call(self, result)
              } else {
                result = yield result.map(function(item, i) {
                  return item.load(prop)
                })
              }
            } else {
              result = yield item.load(prop)
            }
            cb(null, result)
          })()
        }
        // chainable function
        fn.attach = attach
        return fn
      }
      runner.attach = attach
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



db.JSON = Schema.JSON

module.exports = db
