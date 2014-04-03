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
  name: String,
  scene_id: Number, // scene_id for wechat
  ticket: String, // ticket to get the QRCode image from weixin server
})
Channel.belongsTo(Media, {foreignKey: 'media_id'})

Channel.SCHEMA_SQL = [
"CREATE UNIQUE INDEX ON channel(media_id, scene_id);"
].join('\n')


Channel.upsert = Channel.upsertBy('media_id', 'scene_id')


// Generate a unique scene_id
Channel.hook('beforeCreate', function* (data) {
  if (data.scene_id) return
  var count = yield Channel.count({ media_id: this.media_id })
  data.scene_id = count + 1 // 1 ~ 10,000
})

Channel.prototype.tag = function() {
  return SubscriberTag.upsertByObject(this)
}

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


SubscriberTag.registerType('channel', 101, Channel)


module.exports = Channel

