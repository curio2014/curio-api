var utils = require('lodash')
var crc32 = require('buffer-crc32')

utils.crc32 = crc32.unsigned

utils.sleep = function sleep(i) {
  return function(next) {
    setTimeout(next, i * 1000)
  }
}

utils.isGeneratorFunction = function(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

module.exports = utils
