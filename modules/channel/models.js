// use strict;

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
  media_id: { type: Number, null: false }, // media_id for channel, must not be null
  scene_id: { type: Number, null: false }, // scene_id for wechat
  ticket: { type: String, null: false }, // ticket for QRCode image, got via wechat api
})
Channel.belongsTo(Media, {foreignKey: 'media_id'})

Channel.SCHEMA_SQL = [
"CREATE UNIQUE INDEX ON channel(media_id, scene_id);"
].join('\n')


Channel.upsert = Channel.upsertBy('media_id', 'scene_id')



// we must generate a unique scene_id
// and get ticket code from wechat server
Channel.hook('beforeCreate', function* (data) {
  var media_id = data.media_id
  if (!data.scene_id) {
    yield Media.get(data.media_id)
    var count = yield Channel.count({ media_id: media.id })
    data.scene_id = count + 1 // 1 ~ 10,000
  }
  if (!data.ticket) {
    var ticket
    data.ticket = ticket
  }
})

Channel.prototype.tag = function() {
  return SubscriberTag.upsertByObject(this)
}

/**
 * Tag user with this channel,
 * if the `tag` does not exist, create it
 */
Channel.prototype.tagUser = function* (subscriber) {
  var tag = yield this.tag()
  return yield function(next) {
    subscriber.tags.add(tag, next)
  }
}

Channel.prototype.qrcodeUrl = function() {
  return 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' +
          encodeURIComponent(this.ticket)
}

/**
 * Get ticket code via Wechat API
 */
Channel.prototype.getTicket = function* () {
  var media = yield this.load('media')
  var wx = media.wx()
  var result = yield wx.createPermQRCode(this.scene_id)
}


SubscriberTag.registerType('channel', 101, Channel)


module.exports = Channel
