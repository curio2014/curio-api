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

MediaAdmin.ROLES = MEDIA_ADMIN

Media.Admin = MediaAdmin
Media.ADMIN_ROLES = Media.Admin.ROLES

Media.fetcher.admins = function *() {
  var admins = yield MediaAdmin.findByMedia(this.id).attach('user')
  this.admins = admins.map(function(item, i) {
    var user = item.user
    return {
      id: user.id,
      uid: user.uid,
      name: user.name,
      level: user.level,
      role: item.role
    }
  })
  return this
}


module.exports = MediaAdmin

