var RedisStore = require('koa-redis')
var conf = require('../conf')

RedisStore.prototype.mget = function *(ids) {
  var prefix, items
  prefix = this.prefix
  ids = ids.map(function(sid) { return prefix + sid })
  items = yield this.client.mget(ids);
  return ids.map(function(sid, i) {
    try {
      return items[i] && JSON.parse(items[i])
    } catch (e) {}
    return null
  })
}

module.exports = function(options) {
  options = options || {}
  if (typeof options == 'string') {
    options = { prefix: options }
  }
  return RedisStore({
    ttl: options.ttl,
    prefix: options.prefix || conf.redisStore.prefix,
    db: conf.redisStore.database || conf.redis.database,
    pass: conf.redisStore.password || conf.redis.password,
    host: conf.redisStore.host || conf.redis.host,
    port: conf.redisStore.port || conf.redis.port,
  })
}
