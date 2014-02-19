var Cached = require('cached')
var conf = require('../conf')
var redisc = require('./redis')

function create(options) {
  options = options || {}
  options.client = options.client || redisc
  options.prefix = options.prefix || (conf.redis.prefix + 'cache:')
  return new Cached(options)
}

module.exports = create()

module.exports.create = create
