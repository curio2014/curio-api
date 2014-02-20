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
  return logger(ns + ':error')
}


