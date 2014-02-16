var db = require_('lib/db')
var MESSAGE_TYPES = require_('models/consts').MESSAGE_TYPES

/**
 * Messages (and interacts) between end user and media account
 */
var Message = db.define('message', {
  sent_at: Date,
  type: { type: Number, dataType: 'tinyint', null: false },
  content: { type: JSON, null: false }, // the raw json of wechat message
})
MESSAGE_TYPES.bind(Message, 'type')

// from whom to whom
Message.belongsTo('media', {foreignKey: 'media_id'})
Message.belongsTo('subscriber', {foreignKey: 'subscriber_id'})

Message.scolumns = {
  'media_id': null,
  'sent_at': 'desc',
  'type': null
}


module.exports = Message

Message.TYPES = MESSAGE_TYPES
