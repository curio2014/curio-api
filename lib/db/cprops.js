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
    // extract default values for each prop
    defaults[k] = props[k] && props[k].default || props[k]
  }
  hiddenProperty(Model.prototype, '__cprops_default', defaults)

  Model.fetcher['props'] = function* (force_fresh) {
    return yield this.fetchProps(force_fresh)
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
        item.setProps(allProps[i])
      }
    })
    return allProps
  }
  Model.putter['props'] = function* () {
   if (!this.hasOwnProperty('__cprops')) {
     return
   }
   yield this.saveProps()
  }
}



Model.prototype.uuid = function() {
  return this.constructor.modelName + ':' + (this.id || '[new]')
}

Model.prototype.setProps = function(props) {
  if (!this.hasOwnProperty('__cprops')) {
    throw new Error('use Model.registerProps to add some props')
  }
  _.assign(this.__cprops, props)
}

Model.prototype.fetchProps = function *(force_fresh) {
  var self = this, props;
  if (self.hasOwnProperty('__cprops_fetched') && !force_fresh) {
    return self.__cprops_fetched
  }
  props = yield store.get(self.uuid())
  if (props) {
    self.setProps(props)
  }
  Object.defineProperty(self, '__cprops_fetched', {
    emurable: false,
    configurable: true,
    value: props
  })
  return self.__cprops_fetched
}

Model.prototype.saveProps = function saveProps(props) {
  if (props) {
    this.setProps(props)
    delete this.__cprops_fetched
  }
  return store.set(this.uuid(), this.__cprops)
}
Model.prototype.clearProps = function* clearProps() {
  for (var k in this.__cprops) {
    delete this.__cprops[k]
  }
  delete this.__cprops_fetched
  return yield store.del(this.uuid())
}


/**
 * skip dbstore props when toObject
 */
var _toObject = Model.prototype.toObject
Model.prototype.toObject = function(onlySchema) {
  var result = _toObject.apply(this, arguments)
  if (!onlySchema) {
    _.assign(result, this.__cprops)
  }
  return result
}


// After initialize, assign a cprops for instance
Model.hook('afterInitialize', function() {
  var self = this
  var defaults = self.__cprops_default
  if (defaults && !self.hasOwnProperty('__cprops')) {
    var props = {}
    // __cprops should not be changable
    hiddenProperty(self, '__cprops', props)
    // assign all cprops  as instance property
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
