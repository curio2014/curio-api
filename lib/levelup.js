/**
 * Extend leveldb prototype, make it yieldable
 */
var PATH = require('path')
var lmdb = require('lmdb')
var levelup = require('levelup')
var debug = require_('lib/utils/logger').debug('store')

var conf = require_('conf')
var dbpath = PATH.resolve(process.cwd(), conf.dbstore)

var db = levelup(dbpath, { db: lmdb })

debug('Opening LMDB on: %s', dbpath)
db.open(function(err) {
  if (err) throw err;
});


module.exports = db

