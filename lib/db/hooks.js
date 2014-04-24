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
  if (!fn) {
    throw new Error('Hook function cannot be empty')
  }

  // convert generator function to callback style
  if (_.isGeneratorFunction(fn)) {
    var generator = fn
    fn = function(next, data) {
      co(function*() {
        yield generator.call(this, data)
        next()
      }).call(this)
    }
  }

  if (!_fn) {
    model[when] = fn
    return
  }

  model[when] = function() {
    var args = __slice.call(arguments)
    var next = 'function' == typeof args[0] && args[0]

    var self = this
    if (!next) {
      // no callback needed
      // just run old and new serially
      if (_fn) _fn.apply(self, args)
      return fn.apply(self, args)
    }

    // update the callback
    args[0] = function(err, data) {
      if (err) {
        // always break on error
        return next(err)
      }
      // run the new hook
      fn.call(self, next, data)
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
