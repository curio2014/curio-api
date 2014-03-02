/**
 * Extend leveldb prototype, make it yieldable
 */
var PATH = require('path')
var lmdb = require('lmdb')
var levelup = require('levelup')
var debug = require_('lib/utils/logger').debug('store')

var conf = require_('conf')
var dbpath = PATH.resolve(process.cwd(), conf.dbstore)

/**
 * Open new lmdb environment
 */
module.exports = function(namespace) {
  var path = namespace ? PATH.join(dbpath, namespace) : dbpath
  var db = levelup(path, { db: lmdb })

  debug('Opening LMDB on: %s', path)
  db.open(function(err) {
    if (err) throw err
  })

  return db
}

