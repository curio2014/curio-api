var db = require_('lib/db')
var consts = require_('models/consts')
var Passport = require('./passport')

var SALT_LENGTH = 10
var USER_LEVEL = consts.USER_LEVEL

var User = db.define('user', {
  uid: { type: String, null: false },
  name: { type: String, default: '' },
  email: { type: String, index: true },
  level: { type: Number, dataType: 'tinyint', null: false },
  created_at: Date,
  updated_at: Date,
  desc: String,
})

User.getter.privilege = function() {
  return USER_LEVEL.byId(this.get('level')).name
}
User.setter.privilege = function(value) {
  this.level = USER_LEVEL.byName(value).value
}

User.prototype.setPassword = function *(password) {
  return Passport.upsert({ id: this.id, password: Passport.hash(password) })
}


/**
 * Compare password as a yieldable function
 */
User.prototype.comparePassword = function(raw) {
  var self = this
  return function *() {
    var pass = yield Passport.get(this.id)
    return pass.compare(raw)
  }
}


User.prototype.permitted = function(action) {
  if (action === 'admin') {
    return this.level >= USER_LEVEL.ADMIN
  }
  if (action === 'super') {
    return this.level >= USER_LEVEL.SUPER
  }
  return false
}

/**
 * Get user's role on given media
 */
User.prototype.mediaRole = function *(media_id) {
  var MediaAdmin = require_('models/media/admin')
  var admin = yield MediaAdmin.get(media_id, this.id)
  if (!admin) {
    return null
  }
  return admin.role
}


User.LEVEL = USER_LEVEL

module.exports = User
