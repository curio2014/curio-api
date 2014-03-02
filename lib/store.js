/**
 * Wrapper for lmdb database storage
 */
var thunkify = require('thunkify')
var debug = require_('lib/utils/logger').debug('store')
var Storeman = require('storeman')

var proto = Storeman.prototype
proto.get = thunkify(proto.get)
proto.set = thunkify(proto.set)
proto.mget = thunkify(proto.mget)
proto.del = thunkify(proto.del)

var levelup = require('./levelup')
var db = levelup() // default database instance

module.exports = function(namespace, options) {
  options = options || {}
  // independent lmdb environment
  if (options.independent) {
    options.client = levelup(namespace)
  } else {
    options.client = db
    options.prefix = namespace + ':'
  }
  return new Storeman(options)
}
