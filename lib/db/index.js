var __slice = Array.prototype.slice
var thunkify = require('thunkify')
var co = require('co')
var conf = require_('conf')
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var schemaOptions = _.clone(conf.postgres)

schemaOptions.log = conf.debug

var db = new Schema('postgres', schemaOptions)

// A yieldable query function
db.adapter.execute = thunkify(db.adapter.query)

db._define = db.define
db.define = function() {
  var ret = db._define.apply(this, arguments)

  // define How to get a related remote object
  // must return a yialdable object
  ret.putter = {}
  ret.mfetcher = {}
  ret.fetcher = {}

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
  return function* () {
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

/**
 * Load a remote property via fetcher
 */
Model.prototype.load = function* (prop) {
  var self = this
  var fetcher = self.constructor.fetcher[prop]
  var args = __slice.call(arguments, 1)

  if (!fetcher && self[prop]) {
    if (_.isGeneratorFunction(self[prop])) {
      fetcher = self[prop]
    } else {
      // fetch from jugglingdb relations
      fetcher = function() {
        return function(cb) {
          args.push(cb)
          self[prop].apply(self, args)
        }
      }
    }
  }
  if (!fetcher) {
    var err = new Error('dont know how to load "' + prop +
      '" for ' + self.constructor.modelName)
    err.code = 'NOT_IMPLEMENTED'
    throw err;
  }

  return yield fetcher.apply(self, args)
}

/**
 * multi load with cached by item id
 */
Model.mload = function* (prop, items) {
  var self = this
  var mfetcher = self.mfetcher[prop]
  var data = [], cache = {}
  if (mfetcher) {
    data = yield mfetcher.call(self, items)
  } else {
    // TODO: uniquefy duplicate to reduce requests
    data = yield items.map(function(item, i) {
      return item.load(prop)
    })
  }
  return data
}

/**
 * Put a remote attribute with putter
 */
Model.prototype.dump = function* (prop) {
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
    debug('Put a remote property "%s.%s"', self.constructor.modelName, prop)
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

        var fn = function(cb){
          co(function* () {
            result = result || (yield runner)
            debug('try attach "%s" for %s', prop, self.modelName)
            if (Array.isArray(result)) {
              var data = yield self.mload(prop, result)
              if (data && data.length) {
                data.forEach(function(item, i) {
                  result[i][prop] = item
                })
              }
            } else {
              result[prop] = yield result.load(prop)
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

db.JSON = Schema.JSON

require('./hooks')
require('./cprops')

module.exports = db
