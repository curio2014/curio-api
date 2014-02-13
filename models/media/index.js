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

Media.Admin = require('./admin')
Media.ADMIN_ROLES = Media.Admin.ROLES
