var keyf = require('keyf')
var _ = require_('lib/utils')
var error = require_('lib/utils/logger').error('stats')
var timestream = require_('lib/timestream')
var MSG_TYPES = require_('models/consts').MESSAGE_TYPES
var MSG_CONTENT_TYPES = require_('models/consts').MESSSAGE_CONTENT_TYPES

// the underscored value is always the real database value (i.e. int, not readable string)
var msgkey = keyf('message:{media_id}:{_type}')

var ctype_filters = {
  messaging: function(item) {
    // filter user interacts messaging
    return item.type != MSG_CONTENT_TYPES.SUBSCRIBE &&
           item.type != MSG_CONTENT_TYPES.REPORT_LOC &&
           item.type != MSG_CONTENT_TYPES.UNSUBSCRIBE
  },
  all: null
}
var ONE_MINUTE = 60 * 1000
var ONE_HOUR = 60 * ONE_MINUTE
var ONE_DAY = 24 * ONE_HOUR
var deltas = {
  '1hour': ONE_HOUR,
  '1day': ONE_DAY,
  '7days': 7 * ONE_DAY,
  '30days': 30 * ONE_DAY,
}
var interval_by_period = {
  '1hour': ONE_MINUTE,
  '1day': ONE_HOUR,
  '7days': ONE_DAY,
  '30days': ONE_DAY,
}

function parsePeriod(period, end) {
  var end = new Date(end || new Date())
  if (isNaN(+end)) {
    end = new Date()
  }
  if (!(period in deltas)) {
    return
  }
  var start = new Date(end - deltas[period])
  return {
    minDate: start,
    maxDate: end
  }
}



function streamByType(type) {
  /**
   * Return message count timestream data for given media_id,
   * grouped by period and contentType
   */
  return function* (media_id, options) {
    var interval, periods, datums

    options = options || {}

    interval = options.interval
    periods = options.periods || '1day,7days,30days'
    ctypes = options.types || 'messaging,subscribe,unsubscribe'

    if (!Array.isArray(periods)) {
      periods = periods.split(',')
    }
    if (!Array.isArray(ctypes)) {
      ctypes = ctypes.split(',')
    }

    var ret = {}
    datums = periods.forEach(function(p) {
      var obj = {}
      var dates = parsePeriod(p, options.maxDate)
      if (!dates) {
        error('Invalid period: %s, skip', p)
        return
      }
      ctypes.forEach(function(name) {
        var filter = ctype_filters[name]
        if (!filter) {
          var ctype = MSG_CONTENT_TYPES.byName(name)
          if (ctype) {
            filter = function(item) {
              return item.type == ctype.id
            }
          }
        }
        // no filter means this category is not valid
        if (filter === undefined) {
          return
        }
        var key = msgkey({
          media_id: media_id,
          _type: type,
        })
        var opts = _.clone(dates)
        var stream = timestream(key, opts)

        opts.interval = interval || interval_by_period[p]
        opts.key = 'hit'

        if (filter) {
          stream = stream.filter(filter)
        }
        obj[name] = stream.numbers().keep(opts.key)
          .fillup(opts)
          .sum(opts.interval)
      })
      ret[p] = obj
    })
    return yield ret
  }
}

/**
 * incoming message count
 */
exports.incoming = streamByType(MSG_TYPES.INCOMING)
exports.outgoing = streamByType(MSG_TYPES.OUTGOING)


exports.countMessages = function countMessages(items) {
  // group by message keys
  var ops = _.map(items, function(item) {
    return {
      type: 'put',
      key: msgkey(item),
      value: {
        hit: 1,
        type: item._contentType
      }
    }
  })
  timestream.db.batch(ops)
}


