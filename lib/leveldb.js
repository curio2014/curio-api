var debug = require('debug')('curio:leveldb')
var thunkify = require('thunkify')
var leveldb = require('level')
var sublevel = require('level-sublevel')
var SubDB = require('level-sublevel/sub')
var conf = require_('conf')

var db = sublevel(leveldb(conf.leveldb.path))


var proto = SubDB.prototype
proto.put_ = thunkify(proto.put)
proto.get_ = thunkify(proto.get)
proto.del_ = thunkify(proto.del)
proto = leveldb.prototype
proto.put_ = thunkify(proto.put)
proto.get_ = thunkify(proto.get)
proto.del_ = thunkify(proto.del)

module.exports = db
