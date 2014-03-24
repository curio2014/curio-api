/**
 * Statistics with timestreamdb
 */
var keyf = require('keyf')
var TsDB = require('timestreamdb')
var orig = require_('lib/levelup')('statistics', { valueEncoding: 'json' })
var db = TsDB(orig)

function timestream() {
}

module.exports = timestream

timestream.db = db

timestream.counter = function(key) {
  var formatter = keyf(key)

  function count() {
    // get the realkey
    var key = formatter.call(this, arguments)
    return function(value, callback) {
      db.put(key, value, callback)
    }
  }

  // return a timestreamdb read stream
  count.read = function() {
    var key = formatter.call(this, arguments)
    return db.ts(key)
  }

  return count
}
