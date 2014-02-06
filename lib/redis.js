var RedisStore = require('koa-redis')
var conf = require('../conf')
var _ = require('./utils')

module.exports = function(options) {
  options = options || {}
  if (typeof options == 'string') {
    options = { prefix: options }
  }
  options = _.assign({}, conf.redis, conf.redisStore, options)
  options.db = options.database
  options.pass = options.password
  return RedisStore(options)
}
