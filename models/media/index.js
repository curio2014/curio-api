var db = require_('lib/db')
var Media = db.define('media', {
  created_at: Date,
  updated_at: Date,
  uid: { type: String, null: false, unique: true },
  oid: { type: String, null: false, unique: true },
  name: String,
  desc: String,
  wx_token: String,
  wx_appkey: String,
  wx_secret: String,
}, {
})

module.exports = Media

Media.fetcher.admins = function *() {
  var admins = yield Media.Admin.findByMedia(this.id).attach('user')
  this.admins = admins.map(function(item, i) {
    var user = item.user
    return {
      id: user.id,
      name: user.name,
      level: user.level,
      role: item.role
    }
  })
  return this
}

Media.Admin = require('./admin')
Media.ADMIN_ROLES = Media.Admin.ROLES
