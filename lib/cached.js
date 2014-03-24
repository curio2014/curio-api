var Cached = require('cacheable')
var thunkify = require('thunkify')
var conf = require('../conf')
var redisc = require('./redis')

function create(options) {
  if ('string' == typeof options) {
    options = {
      prefix: conf.redis.prefix + options + ':'
    }
  }
  options = options || {}
  options.client = options.client || redisc
  options.prefix = options.prefix || (conf.redis.prefix + 'cache:')
  return new Cached(options)
}

var proto = Cached.prototype
proto.set_ = proto.set
proto.get_ = proto.get
proto.del_ = proto.del
proto.mget_ = proto.mget
proto.set = thunkify(proto.set)
proto.get = thunkify(proto.get)
proto.del = thunkify(proto.del)
proto.mget = thunkify(proto.mget)

// cached.js exports a ready to use instance,
// has a default namespace
module.exports = create()

module.exports.create = create
