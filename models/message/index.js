var co = require('co')
var BatchStream = require('batch-stream2')
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

module.exports = Message

// from whom to whom
Message.belongsTo('media', {foreignKey: 'media_id'})
Message.belongsTo('subscriber', {foreignKey: 'subscriber_id'})

Message.scolumns = {
  'created_at': 'desc',
  'media_id': null,
  'subscriber_id': null,
  'type': null
}


/**
 * Get subscriber, if not exists, create one
 */
Message.fetcher.subscriber = function *() {
  var item = yield Subscriber.get(this.subscriber_id)
  if (!item) {
    item = yield Subscriber.create({
      oid: this.content.user_oid,
      media_id: this.content.media_id
    })
  }
  return item
}

function batchSave(items, callback) {
  var b = this
  debug('Starting batch write %s messages..', items.length)
  var send = function *() {
    try {
      // batch create message items
      yield Message.create(items)
    } catch (e) {
      // ignore ?
      error('Save messages failed. %j', items)
      //setTimeout(co(send), 1000)
    }
    callback()
    debug('batch write %s messages done.', items.length)
  }
  co(send)()
}

var buffer = new BatchStream({
  size: 100,
  batchTimeMs: 2000, // try batch write every 2 seconds
  transform: batchSave
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
 * Incoming message from wechat server
 */
Message.incoming = function(media_id, subscriber_id, content) {
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
  // Save a new message asynchronously
  buffer.write({
    type: TYPES.INCOMING,
    created_at: content.createTime,
    media_id: media_id,
    subscriber_id: subscriber_id,
    contentType: contentType,
    content: {
      content: Object.keys(content.param).length ? content.param : content.text,
    }
  })
}

/**
 * The response we are giving to wechat & end user
 */
Message.outgoing = function(media_id, subscriber_id, content, type) {
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
    subscriber_id: subscriber_id,
    contentType: contentType,
    content: {
      content: content.content,
    }
  })
}


Message.TYPES = TYPES
Message.CONTENT_TYPES = CONTENT_TYPES
