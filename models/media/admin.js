var db = require_('lib/db')
var MEDIA_ADMIN = require_('models/consts').MEDIA_ADMIN
var User = require_('models/user')
var Media = require_('models/media')

var MediaAdmin = db.define('media_admin', {
  created_at: Date,
  user_id: { type: Number, null: false, index: true },
  media_id: { type: Number, null: false, index: true },
})
MEDIA_ADMIN.bind(MediaAdmin, 'role')


module.exports = MediaAdmin


MediaAdmin.get = function(media_id, user_id) {
  if (arguments.length != 2) {
    throw new Error('Must provide media_id & user_id for MediaAdmin get')
  }
  return this.findOne({
    media_id: media_id,
    user_id: user_id
  })
}

var _upsert = MediaAdmin.upsert
MediaAdmin.upsert = function *(media_id, user_id, props) {
  props = props || {}
  var item = yield this.get(media_id, user_id)
  if (item) {
    return yield item.updateAttributes(props)
  }
  props.media_id = media_id
  props.user_id = user_id
  return yield this.create(props)
}

MediaAdmin.findByUser = function *(user_id, options) {
  return yield this.all({ user_id: user_id }, options)
}

MediaAdmin.findByMedia = function() {
}


MediaAdmin.ROLES = MEDIA_ADMIN

