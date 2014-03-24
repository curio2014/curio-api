/**
 * Global events mediator
 */
var __slice = Array.prototype.slice
var util = require('util')

function Mediator() {
  this._handlers = {}
}
util.inherits(Mediator, require('events').EventEmitter)


var mediator = new Mediator()


Mediator.prototype.setHandler = function(name, fn) {
  this._handlers[name] = fn
}

Mediator.prototype.pushHandler = function(name, fn) {
  var current =  this._handlers[name]
  if (current) {
    if (!Array.isArray(current)) {
      current = [current]
      this._handlers[name] = current
    }
    current.push(fn)
  } else {
    this._handlers[name] = fn
  }
}

Mediator.prototype.popHandler = function(name, fn) {
  var current = this._handlers[name]
  var handlers = []
  if (!Array.isArray(current)) {
    current = [current]
  }
  if (current) {
    current.forEach(function(item) {
      if (item !== fn) {
        handlers.push(item)
      }
    })
  }
  this._handlers[name] = handlers
}

Mediator.prototype.execute = function* (name) {
  var args = __slice.call(arguments, 1)
  var handler = this._handlers[name]
  if (handler) {
    return yield handler.apply(this, args)
  }
}

// Only export one instance
module.exports = mediator
