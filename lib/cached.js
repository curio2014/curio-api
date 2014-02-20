var Cached = require('cacheable')
var thunkify = require('thunkify')
var conf = require('../conf')
var redisc = require('./redis')

function create(options) {
  options = options || {}
  options.client = options.client || redisc
  options.prefix = options.prefix || (conf.redis.prefix + 'cache:')
  return new Cached(options)
}

var proto = Cached.prototype
proto.set = thunkify(proto.set)
proto.get = thunkify(proto.get)
proto.del = thunkify(proto.del)
proto.mget = thunkify(proto.mget)


module.exports = create()

module.exports.create = create
