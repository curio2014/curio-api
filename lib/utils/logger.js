"use strict";

var debug = require('debug')
// debug function cache
var debugs = {}

function logger(ns) {
  return debugs[ns] || (debugs[ns] = debug('curio:' + ns))
}

exports.debug = function(ns) {
  return logger(ns + ':debug')
}

exports.log = function(ns) {
  return logger(ns + ':log')
}

exports.error = function(ns) {
  var fn = logger(ns + ':error')
  return function(e) {
    // For an error instance, we only print it's stack
    if (e && e.stack) {
      arguments[0] = e.stack
    }
    fn.apply(this, arguments)
  }
}


