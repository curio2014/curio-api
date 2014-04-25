var keyf = require('keyf')
var _ = require_('lib/utils')
var error = require_('lib/utils/logger').error('stats')
var cached = require_('lib/cached')

var Message = require_('models/message')
var MSG_TYPES = Message.TYPES
var MSG_CONTENT_TYPES = Message.CONTENT_TYPES


var ctype_filters = {
  messaging: {
    nin: [MSG_CONTENT_TYPES.SUBSCRIBE,
          MSG_CONTENT_TYPES.REPORT_LOC,
          MSG_CONTENT_TYPES.UNSUBSCRIBE]
  },
  all: null
}


var interval_by_period = {
  '1hour': 'minute',
  '1day': 'hour',
}

function statsByType(type) {
  /**
   * Return message count timestream data for given media_id,
   * grouped by period and content_type
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
      ret[p] = ctypes.map(function(name) {
        var filter, f, ctype, opts
        filter = {
          media_id: media_id,
          type: type,
        }
        f = ctype_filters[name]
        if (!f) {
          ctype = MSG_CONTENT_TYPES.byName(name)
          if (ctype) {
            filter.content_type = ctype.id
          }
        } else {
          filter.content_type = f
        }
        opts = {
          period: p,
          interval: interval || interval_by_period[p] || 'day',
          filter: filter,
          maxDate: options.maxDate,
          minDate: options.minDate,
        }
        return {
          key: name,
          values: Message.timeseries_count(opts)
        }
      })
    })
    return yield ret
  }
}

/**
 * incoming message count
 */
exports.incoming = statsByType(MSG_TYPES.INCOMING)
exports.outgoing = statsByType(MSG_TYPES.OUTGOING)


exports.homepage = function* (media_id, query) {
  var data = yield exports.incoming(media_id, query)
  return data
}
