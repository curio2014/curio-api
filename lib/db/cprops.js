var store = require_('lib/store')('cprops')
var Model = require('jugglingdb').AbstractClass
var _ = require_('lib/utils')

/**
 * Register key-value stored properties
 */
Model.registerProps = function registerProps(props) {
  var defaults = {}
  var Model = this

  for (var k in props) {
    defaults[k] = props[k] && props[k].default || props[k]
  }
  Object.defineProperty(Model.prototype, '_cprops_default', {
    enumerable: false,
    writable: false,
    value: defaults
  })

  Model.fetcher['props'] = function* () {
    return yield this.fetchProps()
  }
  Model.mfetcher['props'] = function* (items) {
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
    return allProps
  }
  Model.putter['props'] = function* () {
   if (!this.hasOwnProperty('_cprops')) {
     return
   }
   yield this.saveProps()
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
  return function* fetchProps() {
    var props = yield store.get(self.uuid())
    this.loadProps(props)
    return props
  }
}

Model.prototype.saveProps = function saveProps(props) {
  if (props) {
    this.loadProps(props)
  }
  return store.set(this.uuid(), this._cprops)
}
Model.prototype.clearProps = function* clearProps() {
  for (var k in this._cprops) {
    delete this._cprops[k]
  }
  return yield store.del(this.uuid())
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


// Add hooks
Model.hook('afterInitialize', function() {
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
})

function hiddenProperty(where, property, value) {
  Object.defineProperty(where, property, {
    writable: false,
    enumerable: false,
    configurable: false,
    value: value
  });
}
