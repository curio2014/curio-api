var db = require_('lib/db')
var ADMIN_ROLES = require_('models/consts').MEDIA_ADMIN
var User = require_('models/user')
var Media = require_('models/media')
var MediaAdmin = db.define('media_admin', {
  created_at: Date,
  user_id: { type: Number, null: false, index: true },
  media_id: { type: Number, null: false, index: true },
  role: ADMIN_ROLES,
})

MediaAdmin.belongsTo('user', {foreignKey: 'user_id'})
MediaAdmin.belongsTo('media', {foreignKey: 'media_id'})

MediaAdmin.get = MediaAdmin.findBy('media_id', 'user_id', true)
MediaAdmin.findByUser = MediaAdmin.findBy('user_id')
MediaAdmin.findByMedia = MediaAdmin.findBy('media_id')
MediaAdmin.upsert = MediaAdmin.upsertBy('media_id', 'user_id')

MediaAdmin.ROLES = ADMIN_ROLES

MediaAdmin.destroyByMedia = MediaAdmin.destroyBy('media_id')
MediaAdmin.destroyByUser = MediaAdmin.destroyBy('user_id')


module.exports = MediaAdmin


Media.Admin = MediaAdmin

Media.fetcher.admins = function *() {
  var admins = yield MediaAdmin.findByMedia(this.id).attach('user')
  var items = []
  admins.forEach(function(item, i) {
    var user = item.__cachedRelations.user
    if (!user) return
    items.push({
      id: user.id,
      uid: user.uid,
      name: user.name,
      level: user.level,
      role: item.role
    })
  })
  return items
}

/**
 * Use `media.dump('admins', [new User(), ..])` to save admins
 */
Media.putter.admins = function *(items) {
  if (!Array.isArray(items)) {
    return
  }
  var media_id = this.id
  var result = []
  items.map(function(item) {
    var role = ADMIN_ROLES.get(item.role)
    if (role) {
      result.push({
        media_id: media_id,
        user_id: item.id,
        role: role,
      })
      // item is a user object with an extra `role` attribute
    }
  })
  if (result.length) {
    yield MediaAdmin.destroyByMedia(this.id)
    yield MediaAdmin.create(result)
  }
  yield this.load('admins')
}

Media.hook('afterDestroy', function* (){
  yield MediaAdmin.destroyByMedia(this.id)
})

// delete admins for user
User.hook('afterDestroy', function* () {
  yield MediaAdmin.destroyByUser(this.id)
})

