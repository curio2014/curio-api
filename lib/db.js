var co = require('co')
var debug = require('debug')('curio:db')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var redisc = require('./redis')({
  prefix: 'curio:dbstore:',
  ttl: null,
})
var db = new Schema('postgres', require_('conf').postgres)
var _ = require('./utils')

/**
 * Get by id(number) or uid(string)
 */
Model.get = function getOne(id) {
  if (isdigit(id)) return this.find(id)
  return this.findOne({uid: id})
}

Model.prototype.uuid = function() {
  return this.constructor.modelName + ':' + this.id;
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

Model.afterInitialize = function() {
  var self = this
  var defaults = self.constructor._cprops_default
  if (defaults !== undefined && !self.hasOwnProperty('_cprops')) {
    var props = _.clone(defaults);
    hiddenProperty(self, '_cprops', props)
    _.forEach(defaults, function(dft, name) {
      Object.defineProperty(self, name, {
        enumerable: true,
        get: function() {
          return props[name]
        },
        set: function(value) {
          props[name] = value
        }
      })
    })
  }
}

Model.beforeSave = function(next) {
  var self = this
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
 * Update to object
 */
var _toObject = Model.prototype.toObject
Model.prototype.toObject = function(onlySchema) {
  var result = _toObject.call(this, onlySchema)
  if (!onlySchema) {
    _.assign(result, this._props)
  }
  return result
}

Model.prototype.fetchProps = function() {
  var self = this;
  return function *fetchProps() {
    var props = yield redisc.get(self.uuid())
    self.fromObject(props)
  }
}

Model.prototype.saveProps = function saveProps(props) {
  if (props) {
    this.fromObject(props)
  }
  return redisc.set(this.uuid(), this._cprops)
}
Model.prototype.clearProps = function *clearProps() {
  return yield redisc.destroy(this.uuid())
}

// make all the callback method yieldable
;['upsert', 'create', 'count', 'all', 'find', 'findOne'].forEach(function(name, i) {
  var fn = Model[name + '_'] = Model[name]
  Model[name] = function() {
    var args = Array.prototype.slice.call(arguments)
    var self = this;
    var hasProps = self.hasOwnProperty('_cprops_default')
    // when callback provided, run as normal async method
    if (typeof args[args.length-1] === 'function') {
      return fn.apply(self, args)
    }
    if (name == 'all' || name == 'findOne') {
      args = flattenQuery.apply(self, args)
    }
    return function(next) {
      // fetch props when query
      if (hasProps) {
        var _next = next
        if (name == 'all' && args[0].loadProps == true) {
          next = function(err, items) {
            if (err) return _next(err, items)
            var uuids = items.map(function(item) { return item.uuid() })
            co(function *() {
              // get all props
              var allProps = yield redisc.mget(uuids)
              items.forEach(function(item, i) {
                if (allProps[i]) {
                  // load properties
                  item.fromObject(allProps[i])
                }
              })
              return _next(null, items)
            })()
          }
        } else {
          next = function(err, item) {
            co(function *() {
              if (item instanceof self) {
                yield item.fetchProps()
              }
              _next(err, item)
            })()
          }
        }
      }
      debug('[%s]:', name, args)
      args.push(next)
      fn.apply(self, args)
    }
  }
})

Model.prototype.save_ = Model.prototype.save
Model.prototype.save = function(options) {
  var fn = Model.prototype.save_
  var self = this
  return function *save(cb) {
    fn.call(self, options, cb)
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
