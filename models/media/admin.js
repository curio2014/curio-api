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

MediaAdmin.belongsTo('user', {foreignKey: 'user_id'})
MediaAdmin.belongsTo('media', {foreignKey: 'media_id'})

MediaAdmin.get = MediaAdmin.finder('media_id', 'user_id', true)
MediaAdmin.findByUser = MediaAdmin.finder('user_id')
MediaAdmin.findByMedia = MediaAdmin.finder('media_id')
MediaAdmin.upsert = MediaAdmin.upsertBy('media_id', 'user_id')

MediaAdmin.ROLES = MEDIA_ADMIN

Media.Admin = MediaAdmin
Media.ADMIN_ROLES = Media.Admin.ROLES

Media.fetcher.admins = function *() {
  var admins = yield MediaAdmin.findByMedia(this.id).attach('user')
  return admins.map(function(item, i) {
    var user = item.user
    return {
      id: user.id,
      uid: user.uid,
      name: user.name,
      level: user.level,
      role: item.role
    }
  })
}


module.exports = MediaAdmin

