var leveldb = require('./leveldb')
var store = leveldb.sublevel('storage')

module.exports = store
