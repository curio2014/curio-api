var db = require_('lib/db')
var MESSAGE_TYPES = require_('models/consts').MESSAGE_TYPES

var Message = db.define('message', {
  subscriber_id: { type: Number, null: false, index: true },
  media_id: { type: Number, null: false, index: true },
  sent_at: Date,
  type: { type: Number, dataType: 'tinyint', null: false },
  content: { type: JSON, null: false },
})
MESSAGE_TYPES.bind(Message, 'type')

module.exports = Message

Message.TYPES = MESSAGE_TYPES
