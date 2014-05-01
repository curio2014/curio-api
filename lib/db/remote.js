var __slice = [].slice
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')
var Model = require('jugglingdb').AbstractClass


/**
 * multi load
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
 * Put a remote attribute with putter
 */
Model.prototype.dump = function* (prop) {
  var self = this, putter, data
  if (!prop) {
    // save all props
    for (prop in self.constructor.putter) {
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
 * Dump object with attached data
 */
Model.prototype.toJSON = function() {
  debugger
  return this.toObject(false, true)
}

Model.canAttach = function(name) {
  return this.fetcher.hasOwnProperty(name) || this.prototype.hasOwnProperty(name)
}

