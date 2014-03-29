//var hooks = require('hooks')
var co = require('co')
var __slice = Array.prototype.slice
var Model = require('jugglingdb').AbstractClass
var _ = require_('lib/utils')

//for (var k in hooks) {
  //Model[k] = hooks[k]
//}

/**
 * Add hook, will generate a serial call stack
 */
Model.hook = function(when, fn) {
  var model = this, _fn = model[when]
  var isGenFunc = _.isGeneratorFunction(fn)
  if (!fn) {
    throw new Error('Hook function cannot be empty')
  }
  if (!_fn) {
    if (isGenFunc) {
      model[when] = function(next, data) {
        co(function* (data) {
          try {
            yield fn.call(this, data)
          } catch (e) {
            return next(e)
          }
          next()
        }).call(this, data)
      }
    } else {
      model[when] = fn
    }
    return
  }

  model[when] = function() {
    var args = __slice.call(arguments)
    var next = 'function' == typeof args[0] && args[0]

    var self = this
    // no callback needed
    if (!next) {
      if (_fn) {
        _fn.apply(self, args)
      }
      return fn.apply(self, args)
    }

    // is a generator function
    if (isGenFunc) {
      args[0] = function(err) {
        co(function* () {
          try {
            yield fn.apply(self, args.slice(1))
          } catch (e) {
            return next(e)
          }
          next()
        }).call(self)
      }
    } else {
      // update the callback
      args[0] = function(err) {
        if (err) {
          // always break on error
          return next(err)
        }
        // apply the same arguments (including the callback)
        fn.apply(self, _.clone(args))
      }
    }
    // run the existing hook first
    _fn.apply(self, args)
  }
}

Model.hook('beforeCreate', function* () {
  var self = this
  // Timestamp hooks
  if (this.hasColumn('created_at') && !this.created_at) {
    this.created_at = new Date;
  }
})

Model.hook('beforeSave', function* () {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date;
  }
  yield self.dump()
})

Model.hook('afterSave', function(next) {
  this._clearCache(next)
})
Model.hook('afterDestroy', function(next) {
  this._clearCache(next)
})
