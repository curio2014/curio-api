// use strict;
var debug = require_('lib/utils/logger').debug('channel')
var co = require('co')
var cached = require_('lib/cached')
var db = require_('lib/db')
var _ = require_('lib/utils')
var Media = require_('models/media')
var SubscriberTag = require_('models/subscriber/tag')

/**
 * Channel: QR Code management
 *
 * A channel binds to a marketing place and a QR code,
 * whenever a user scanned the QR code, he/she is logged
 * and tagged.
 *
 */
var Channel = db.define('channel', {
  created_at: Date,
  updated_at: Date,
  name: { type: String, null: false },
  desc: String,
  media_id: { type: Number, null: false }, // media_id for channel, must not be null
  scene_id: { type: Number, null: false }, // scene_id for wechat
})

Channel.belongsTo(Media, {foreignKey: 'media_id'})

Channel.SCHEMA_SQL = [
"CREATE UNIQUE INDEX ON channel(media_id, scene_id);"
].join('\n')


Channel.upsert = Channel.upsertBy('media_id', 'scene_id')


// Fillup data before validate
Channel.hook('beforeSave', function* () {
  // generate a unique scene_id
  if (!this.scene_id) {
    this.scene_id = yield Channel.nextSceneId(this.media_id)
  }
  if (!this.name) {
    this.name = 'Scene ' + this.scene_id
  }
})

// get QRCode after create
Channel.hook('afterCreate', function* () {
  this.qrcodeUrl = yield this.qrcodeUrl()
})

/**
 * Get next scene id for a media
 */
Channel.nextSceneId = function* (media_id) {
  if (!media_id) {
    throw new Error('Must provide media_id')
  }
  var last = yield Channel.findOne({ where: { media_id: media_id }, order: 'scene_id desc' })
  return last ? last.scene_id + 1 : 1
}


// TODO: remove user tags when destroy
// Channel.hook('beforeDestroy', function* () {
// })



// =========== Instance Methods ============
//

Channel.prototype.tag = function(media_id) {
  return SubscriberTag.upsertByObject(media_id, this)
}

/**
 * Tag user with this channel,
 * if the `tag` does not exist, create it
 */
Channel.prototype.tagUser = function* (subscriber) {
  var tag = yield this.tag(subscriber.media_id)
  return yield function(next) {
    subscriber.tags.add(tag, next)
  }
}

/**
 * Must call an async function to get qrcode url
 */
Channel.prototype.qrcodeUrl = function* () {
  var ticket = this.ticket
  if (!ticket) {
    ticket = this.ticket = yield this.getTicket()
  }
  return ticket && 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' +
          encodeURIComponent(ticket)
}

/**
 * Get ticket code via Wechat API,
 */
Channel.prototype.getTicket = function* () {
  var key = this._ticket_cache_key()
  var ticket = yield cached.get(key)
  if (ticket) {
    return ticket
  }
  var media = yield this.load('media')
  if (!media || !media.wx()) {
    return
  }
  // get permnant qrcode from wechat server
  var ret = yield media.wx().createPermQRCode(this.scene_id)
  var expires = ret.expire_seconds ? ret.expire_seconds - 5 : null
  ticket = ret.ticket
  // save to cache, with expire seconds
  yield cached.set(key, ticket, expires)
  return ticket
}

Channel.prototype._ticket_cache_key = function() {
  return 'channel:ticket:' + this.scene_id
}

cached.register(Channel)


SubscriberTag.registerType('channel', 101, Channel)


module.exports = Channel
