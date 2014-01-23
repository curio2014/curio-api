var db = require_('lib/db')

var Message = db.model({
  tableName: 'message',
})

module.exports = Message

