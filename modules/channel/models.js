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
  ticket: String, // ticket to get the QRCode
})
Channel.belongsTo(Media, {foreignKey: 'media_id'})
Channel.belongsTo(SubscriberTag, {as: 'tag', foreignKey: 'tag_id'})

/**
 * Generate a unique scene_id for a media
 */
Channel.hook('beforeCreate', function* (data) {
  var count = yield Channel.count({ media_id: this.media_id })
  data.scene_id = data.scene_id || count
})

Channel.prototype.qrcodeUrl = function() {
  return 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' +
          encodeURIComponent(this.ticket)
}


SubscriberTag.registerType('channel', 101, Channel)

module.exports = Channel

