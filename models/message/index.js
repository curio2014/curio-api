var co = require('co')
var BatchStream = require('batch-stream2')
var debug = require_('lib/utils/logger').debug('message')
var error = require_('lib/utils/logger').error('message')
var db = require_('lib/db')
var mediator = require_('lib/mediator')
var consts = require_('models/consts')

var Media = require_('models/media')
var User = require_('models/user')
var Subscriber = require_('models/subscriber')

var CONTENT_TYPES = consts.MESSSAGE_CONTENT_TYPES
var TYPES = consts.MESSAGE_TYPES
var EVTS = consts.GLOBAL_EVENTS

/**
 * Messages (and interacts) between end user and media account
 */
var Message = db.define('message', {
  created_at: Date,
  flag: { type: Boolean, default: false },
  type: TYPES,
  content_type: CONTENT_TYPES,
  content: db.JSON, // the raw json of wechat message
})

module.exports = Message

// "replier" sent a message to "subsciber", as "media"
Message.belongsTo(Media, {as: 'media', foreignKey: 'media_id'})
Message.belongsTo(Subscriber, {as: 'subscriber', foreignKey: 'subscriber_id'})
Message.belongsTo(User, {as: 'replier', foreignKey: 'user_id'})

Subscriber.SCHEMA_SQL = [
"CREATE INDEX ON message(media_id);",
"CREATE INDEX ON message(subscriber_id);",
"CREATE INDEX ON message(content_type) where content_type in (" + [CONTENT_TYPES.SUBSCRIBE, CONTENT_TYPES.UNSUBSCRIBE] + ");",
].join('\n')


Message.scolumns = {
  'created_at': 'desc',
  'media_id': null,
  'subscriber_id': null,
  'content_type': null,
  'type': null
}


/**
 * Get subscriber, if not exists, create one
 */
Message.fetcher.subscriber = function *() {
  var item = yield Subscriber.get(this.subscriber_id)
  if (!item) {
    // XXX: If subscriber not exists, it is most likely
    // a cache error, remember to clean message like this!
    item = new Subscriber({
      id: this.subscriber_id,
      oid: 'N/A',
      media_id: this.media_id
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
      items = yield Message.create(items)
    } catch (e) {
      // ignore ?
      error('Save messages failed. %j', items)
      //setTimeout(co(send), 1000)
    }
    // global hook
    mediator.emit(EVTS.SAVE_MESSAGES, items)

    callback()
    debug('batch write %s messages done.', items.length)
  }
  co(send)()
}

var buffer = new BatchStream({
  size: 500,
  timeout: 2000, // try batch write every 2 seconds
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
  var content_type = content.type.toUpperCase()
  if (content_type == 'EVENT') {
    var param = content.param || {}
    content_type = (param.event || '').toUpperCase()
    // message type "loation" is different with report location via an EVENT message
    if (content_type == 'LOCATION') {
      content_type = 'REPORT_LOC'
    }
  }
  // convert content type to a INT consts
  if (content_type in CONTENT_TYPES) {
    content_type = CONTENT_TYPES[content_type]
  } else {
    content_type = CONTENT_TYPES.UNKOWN
  }

  // Save a new message asynchronously
  buffer.write({
    type: TYPES.INCOMING,
    flag: content.flag || false,
    created_at: content.createTime,
    media_id: media_id,
    subscriber_id: subscriber_id,
    content_type: content_type,
    content: content_type === CONTENT_TYPES.TEXT ? content.text : content.param
  })
}

/**
 * The response we are giving to wechat & end user
 */
Message.outgoing = function(media_id, subscriber_id, content) {
  var content_type = content.msgType.toUpperCase()
  if (content_type in CONTENT_TYPES) {
    content_type = CONTENT_TYPES[content_type]
  } else {
    content_type = CONTENT_TYPES.UNKOWN
  }

  buffer.write({
    type: content.type || TYPES.REPLY,
    flag: content.flag || false,
    created_at: content.createTime,
    media_id: media_id,
    subscriber_id: subscriber_id,
    content_type: content_type,
    content: content.content,
  })
}


Message.TYPES = TYPES
Message.CONTENT_TYPES = CONTENT_TYPES
