var conf = require('../conf')
var cached = require('./cached')

var PREFIX = conf.redis.prefix + 'store:'

module.exports = function(namespace) {
  return cached.create({
    prefix: PREFIX + namespace + ':'
  })
}
