var debug = require('debug')
var utils = require('lodash')
var crc32 = require('buffer-crc32');

utils.crc32 = crc32.unsigned

// debug function cache
var debugs = {}

utils.debug = function(ns) {
  return debugs[ns] || (debugs[ns] = debug('curio:' + ns))
}

utils.sleep = function sleep(i) {
  return function(next) {
    setTimeout(next, i * 1000)
  }
}

utils.isGeneratorFunction = function(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

module.exports = utils
