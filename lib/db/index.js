var __slice = [].slice
var thunkify = require('thunkify')
var co = require('co')
var conf = require_('conf')
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var schemaOptions = _.clone(conf.postgres)
var Named = require_('lib/named')

schemaOptions.log = conf.debug

var db = new Schema('postgres', schemaOptions)

db._define = db.define
db.define = function(name, columns) {
  // gather enum properties first,
  // based on Named() object
  var enums = {}
  _.each(columns, function(val, k) {
    if (val instanceof Named) {
      enums[k] = val
      delete columns[k]
    }
  })
  var ret = db._define.apply(this, arguments)
  // define How to get a related remote object
  // must return a yialdable object
  ret.putter = {}
  ret.mfetcher = {}
  ret.fetcher = {}

  for (var k in enums) {
    enums[k].bind(ret, k)
  }

  return ret
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
  if (_.isdigit(id)) {
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
Model.scolumns = {}
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

Model.prototype.hasColumn = function(name) {
  return this.constructor.properties.hasOwnProperty(name)
}

Model.upsert_ = Model.upsert
Model.upsert = function(uid, props) {
  var self = this
  if (_.isdigit(uid)) {
    props = props || {}
    props.id = uid
    return function(next) {
      debug('%s.upsert %j', self.modelName, props)
      self.upsert_(props, next)
    }
  }
  return function* () {
    var item = yield self.findOne({where: { uid: uid }, fresh: true})
    if (item) {
      yield item._clearCache
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
 *    Model.findByUser = Model.findBy('user_id')
 *    Model.getByAandB = Model.findBy('a', 'b', onlyOne=true)
 */
Model.findBy = function() {
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

/**
 * Generate a function with positional arguments,
 * to upsert an item with multiple property
 *
 * Examples:
 *
 *    Model.upsert = Model.upsertBy('media_id', 'name')
 *
 *    var name = 'some name',
 *    var media_id = Media.id
 *
 *    Model.upsert(media_id, name)
 */
Model.upsertBy = function() {
  var props = __slice.call(arguments)
  return function* upsertByProps() {
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

Model.destroyBy = function() {
  var props = __slice.call(arguments)
  var len = props.length
  return function* destroyByProps() {
    var args = __slice.call(arguments)
    if (args.length < len) {
      throw new Error('All arguments are required: ' + props.join(', '))
    }
    var query = _.zipObject(props, args)
    var items = yield this.all({ where: query })
    return yield items.map(function(item) { return item.destroy() })
  }
}

/**
 * Validate attributes
 */
Model.prototype.validate = function (data) {
  var self = this
  return function(next) {
    // `.isValid` requires function length, so you cannot pass `next` directly
    return self.isValid(function(err, valid) {
      if (err && err.name === 'ValidationError') {
        err = null
      }
      next(err, valid)
    }, data)
  }
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

    function assign(obj, prop, val) {
      if (obj.__cachedRelations) {
        obj.__cachedRelations[prop] = val
      } else {
        obj[prop] = val
      }
    }

    if (isRead) {
      // attach more async objects
      runner.attach = function attach(prop) {
        if (Array.isArray(prop)) {
          var ret = runner, name
          while (prop.length) {
            name = prop.shift()
            ret = ret.attach(name)
          }
          return ret
        }

        var fn = function(cb){
          co(function* () {
            result = result || (yield runner)
            debug('try attach "%s" for %s', prop, self.modelName)
            if (Array.isArray(result)) {
              var data = yield self.mload(prop, result)
              if (data && data.length) {
                data.forEach(function(item, i) {
                  assign(result[i], prop, item)
                })
              }
            } else {
              // do assign load result to that property
              assign(result, prop, yield result.load(prop))
            }
            cb(null, result)
          })()
        }
        // chainable function
        fn.attach = attach
        return fn
      }
    }
    runner.model = this

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

db.JSON = Schema.JSON

module.exports = db

require('./client')
require('./hook')
require('./remote')
require('./cprops')
require('./timeseries')


/**
 * Timestamp support
 */
Model.hook('beforeCreate', function* () {
  var self = this
  // Timestamp hooks
  if (this.hasColumn('created_at') && !this.created_at) {
    this.created_at = new Date();
  }
})
Model.hook('beforeSave', function* () {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date();
  }
  yield self.dump()
})

/**
 * Fake method of clear cache
 *
 * Cacheable.register(Model) will add a proper method for this
 *
 * see `require('cacheable')`
 *
 */
Model.prototype._clearCache = function(next) {
  if (next) next()
}
Model.hook('afterSave', function(next) {
  this._clearCache(next)
})
Model.hook('afterDestroy', function(next) {
  this._clearCache(next)
})
