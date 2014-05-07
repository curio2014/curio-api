"use strict";

//var hooks = require('hooks')
var co = require('co')
var __slice = Array.prototype.slice
var Model = require('./model')
var _ = require_('lib/utils')

//for (var k in hooks) {
  //Model[k] = hooks[k]
//}

/**
 * Add hook, will generate a serial call stack.
 * the signature of `fn` is `fn(data)`, where
 * data may be `undefined` for some hooks.
 *
 * You can throw an Error to stop break the operation.
 *
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

