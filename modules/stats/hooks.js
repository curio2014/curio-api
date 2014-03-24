var keyf = require('keyf')
var timestream = require_('lib/timestream')
var mediator = require_('lib/mediator')
var EVTS = require_('models/consts').GLOBAL_EVENTS

// the underscored value is always the real database value (i.e. int, not readable string)
var msgkey = keyf('message:{_media_id}:{_type}:{_contentType}')

mediator.on(EVTS.SAVE_MESSAGES, function(items) {
  var ops = items.map(function(item) {
    return {
      type: 'put',
      key: msgkey(item),
      value: {
        type: item.contentType,
        subscriber: item.subscriber_id
      },
      version: +item.created_at
    }
  })
  timestream.db.batch(ops)
})
