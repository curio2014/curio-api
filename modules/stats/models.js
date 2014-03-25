var keyf = require('keyf')
var _ = require_('lib/utils')
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
var interval_by_period = {
  '7days': 'day',
  '1day': 'hour',
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
    periods = options.periods || '7days,1day'
    ctypes = options.types || 'messaging,subscribe,unsubscribe'

    if (!Array.isArray(periods)) {
      periods = periods.split(',')
    }
    if (!Array.isArray(ctypes)) {
      ctypes = ctypes.split(',')
    }

    var ret = {}
    datums = periods.map(function(p) {
      var obj = {}
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
        var stream = timestream(key, {period: p, maxDate: options.maxDate})
        if (filter) {
          stream = stream.filter(filter)
        }
        obj[name] = stream.numbers().keep('hit').count(interval || interval_by_period[p])
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


