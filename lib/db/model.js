"use strict";

var thunkify = require('thunkify')
var co = require('co')
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')

/**
 * AbstractionClass for a Model
 */
//function Model(data, options) {
  //this.initialize(data, options)
//}
var Model = require('jugglingdb').AbstractClass

Model.prototype.hasColumn = function(name) {
  return this.constructor.hasColumn(name)
}

Model.hasColumn = function(name) {
  return this.properties.hasOwnProperty(name)
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


module.exports = Model

require('./finder')

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

// make all the callback method yieldable
;['create', 'count', 'destroyAll', 'all', 'find', 'findOne'].forEach(function(name, i) {
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

    // assign fetched data to instance cache
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

require('./hook')
require('./remote')
require('./cprops')
require('./timeseries')


/**
 * Timestamp support
 */
Model.hook('beforeCreate', function(next) {
  var self = this
  // Timestamp hooks
  if (this.hasColumn('created_at') && !this.created_at) {
    this.created_at = new Date();
  }
  next()
})

Model.hook('beforeSave', function* () {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date();
  }
})

Model.hook('afterSave', function* () {
  yield this._clearCache
  // dump all remote attributes
  yield this.dump()
})
Model.hook('afterDestroy', function(next) {
  this._clearCache(next)
})


