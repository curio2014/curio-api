/**
 * Statistics with timestreamdb
 */
module.exports = ts

var keyf = require('keyf')
var TsDB = require('timestreamdb')
var orig = require_('lib/levelup')('statistics', { valueEncoding: 'json' })
var debug = require_('lib/utils/logger').debug('timestream')
var error = require_('lib/utils/logger').error('timestream')

var db = TsDB(orig)

var ONE_HOUR = 3600 * 1000
var ONE_DAY = 24 * ONE_HOUR
var deltas = {
  '1hour': ONE_HOUR,
  '1day': ONE_DAY,
  '7days': 7 * ONE_DAY
}

function parsePeriod(options) {
  var period = options.period
  var end = new Date(options.maxDate || new Date())
  if (isNaN(+new Date())) {
    end = new Date()
  }
  if (!(period in deltas)) {
    error('Invalid period: ' + period)
    period = '1hour'
  }
  var start = new Date(end - deltas[period])
  return {
    minDate: start,
    maxDate: end
  }
}


/**
 * A more formatted API for timestream
 */
function ts(key, options) {
  options = options || { period: '7days' }
  options = parsePeriod(options)
  //debug('[stream] %s, %j', key, options)
  var stream = db.ts(key, options)
  // monkey patching
  if (!stream.then) {
    // fake timestream as a promise object, so `co` can `yield` it
    stream.constructor.prototype.then = stream.constructor.prototype.toArray
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
