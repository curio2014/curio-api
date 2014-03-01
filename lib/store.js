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

var db = require('./levelup')

module.exports = function(namespace, options) {
  options = options || {}
  options.client = db
  options.prefix = namespace + ':'
  return new Storeman(options)
}
