var co = require('co')
var Batcher = require('batcher')
var debug = require_('lib/utils/logger').debug('message')
var error = require_('lib/utils/logger').error('message')
var db = require_('lib/db')
var consts = require_('models/consts')
var Subscriber = require_('models/subscriber')
var CONTENT_TYPES = consts.MESSSAGE_CONTENT_TYPES
var TYPES = consts.MESSAGE_TYPES

/**
 * Messages (and interacts) between end user and media account
 */
var Message = db.define('message', {
  created_at: Date,
  content: db.JSON, // the raw json of wechat message
})
TYPES.bind(Message, 'type')
CONTENT_TYPES.bind(Message, 'contentType')

// from whom to whom
Message.belongsTo('media', {foreignKey: 'media_id'})
Message.belongsTo('subscriber', {foreignKey: 'subscriber_id'})

Message.scolumns = {
  'created_at': 'desc',
  'media_id': null,
  'subscriber_id': null,
  'type': null
}


function batchSave(items) {
  var b = this
  debug('Starting batch write %s messages..', items.length)
  var send = function *() {
    var users = {}, item, user_id, key
    // findout the subscriber_id
    for (var i = 0, l = items.length; i < l; i++) {
      item = items[i]
      key = item.content.uid + ':' + item.media_id
      user = users[key]
      if (!user) {
        users[key] = user = new Subscriber({
          oid: item.content.uid,
          media_id: item.media_id
        })
        debug('getting user id: %s', user.oid)
        yield user.getId()
      }
      item.subscriber_id = user.id
    }
    try {
      // batch create message items
      yield Message.create(items)
    } catch (e) {
      // ignore ?
      error('Save messages failed. %j', items)
      //setTimeout(co(send), 1000)
    }
    b.resume()
    debug('batch write %s messages done.', items.length)
  }
  b.pause()
  co(send)()
}

var buffer = new Batcher({
  batchSize: 50,
  batchTimeMs: 3000, // try batch write every 3 seconds
  encoder: batchSave
})

// manually start the stream
buffer.resume()

/**
 * Is an incoming message
 */
Message.prototype.isIncoming = function() {
  return this._type == TYPES.INCOMING
}

/**
 * Save a new message asynchronously
 */
Message.incoming = function(media_id, content) {
  var contentType = content.type.toUpperCase()
  if (contentType == 'EVENT') {
    var param = content.param || {}
    contentType = (param.event || '').toUpperCase()
  }
  if (contentType in CONTENT_TYPES) {
    contentType = CONTENT_TYPES[contentType]
  } else {
    contentType = CONTENT_TYPES.UNKOWN
  }
  buffer.write({
    type: TYPES.INCOMING,
    created_at: content.createTime,
    media_id: media_id,
    contentType: contentType,
    content: {
      raw: content.raw,
      uid: content.uid,
      content: Object.keys(content.param).length ? content.param : content.text,
    }
  })
}

Message.outgoing = function(media_id, content, type) {
  var contentType = content.msgType.toUpperCase()
  if (contentType in CONTENT_TYPES) {
    contentType = CONTENT_TYPES[contentType]
  } else {
    contentType = CONTENT_TYPES.UNKOWN
  }
  type = type || TYPES.REPLY
  buffer.write({
    type: type,
    created_at: content.createTime,
    media_id: media_id,
    contentType: contentType,
    content: {
      uid: content.uid,
      content: content.content,
    }
  })
}


module.exports = Message

Message.TYPES = TYPES
Message.CONTENT_TYPES = CONTENT_TYPES
