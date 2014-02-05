var db = require_('lib/db')
var MEDIA_ADMIN = require_('models/consts').MEDIA_ADMIN
var User = require_('models/user')
var Media = require_('models/media')

var MediaAdmin = db.define('media_admin', {
  role: { type: Number, dataType: 'tinyint', null: false },
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

MediaAdmin.findByUser = function *(user_id) {
  var collection = yield this.all({ user_id: user_id })
  return collection
}

MediaAdmin.findByMedia = function() {
}


MediaAdmin.ROLES = MEDIA_ADMIN

