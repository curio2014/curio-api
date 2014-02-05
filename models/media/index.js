var db = require_('lib/db')
var Media = db.define('media', {
  uid: { type: String, null: false },
  oid: { type: String, null: false },
  name: String,
  desc: String,
}, {
})

Media.registerProps({
  wx_appkey: String,
  wx_secret: String,
});

module.exports = Media

Media.Admin = require('./admin')
Media.ADMIN_ROLES = Media.Admin.ROLES
