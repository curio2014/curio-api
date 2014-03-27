/**
 * Statistics with timestreamdb
 */
module.exports = ts

var keyf = require('keyf')
var timestream = require('timestream')
var TsDB = require('timestreamdb')
var orig = require_('lib/levelup')('statistics', { valueEncoding: 'json' })
var debug = require_('lib/utils/logger').debug('timestream')

var db = TsDB(orig)

// fake timestream as a promise object, so `co` can `yield` it
timestream.prototype.then = timestream.prototype.toArray

/**
 * A more formatted API for timestream
 */
function ts(key, options) {
  //debug('[stream] %s, %j', key, options)
  var stream = db.ts(key, options)
  if (!stream.constructor.prototype.then) {
    var proto = stream.constructor.prototype
    proto.then = proto.toArray
    // fillup empty record interval
    proto.fillup = function(options) {
      var ts = timestream.gen({
        start: +options.minDate,
        //start: +options.minDate + options.interval,
        until: +options.maxDate,
        interval: options.interval,
        key: options.key,
        increment: 0,
      })
      return this.union(ts)
    }
  }
  return stream
}

ts.db = db

ts.counter = function(key) {
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
