/**
 * Extend leveldb prototype, make it yieldable
 */
var PATH = require('path')
//var lmdb = require('lmdb')
var levelup = require('levelup')
var log = require_('lib/utils/logger').log('store')

var conf = require_('conf')
var dbpath = PATH.resolve(process.cwd(), conf.dbstore)

/**
 * Open/Create new lmdb environment
 */
module.exports = function(dbname, options) {
  dbname = dbname || 'default'
  options = options || {}
  //options.db = lmdb

  var path = PATH.join(dbpath, dbname)
  var db = levelup(path, options)

  log('Opening LevelUP database on: %s', path)
  db.open(function(err) {
    if (err) throw err
  })

  return db
}

