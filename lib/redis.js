var redis = require('redis')
var conf = require('../conf')
var _ = require('./utils')

function create(options) {
  options = options || {}
  _.defaults(options, conf.redis)

  var client = redis.createClient(options.port, options.host, options)

  if (options.database) {
    client.select(options.database)
  }
  return client
}

// create a default client
module.exports = create(conf.redis)
module.exports.createClient = create
