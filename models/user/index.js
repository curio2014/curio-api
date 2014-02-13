var db = require_('lib/db')
var _ = require_('lib/utils')
var consts = require_('models/consts')
var USER_LEVEL = consts.USER_LEVEL

var User = db.define('user', {
  created_at: Date,
  updated_at: Date,
  email: { type: String, unique: true },
  uid: { type: String, null: false, unique: true },
  name: { type: String, default: '' },
  desc: String,
})
USER_LEVEL.bind(User, 'level')


module.exports = User


var RE_EMAIL = /^[\w\.\-]+\@([\w\-]+\.){1,}[\w]+$/i;

User.validatesUniquenessOf('email', {message: 'conflict'})
User.validate('email', function(err) {
  if (!RE_EMAIL.test(this.email)) err()
}, {message: 'bad'})



var Passport = require('./passport')

User.prototype.setPassword = function(password) {
  return Passport.upsert(this.id, { password: Passport.hash(password) })
}

/**
 * Compare password as a yieldable function
 */
User.prototype.comparePassword = function(raw) {
  var self = this
  return function *() {
    var pass = yield Passport.get(self.id)
    return pass.compare(raw)
  }
}


User.prototype.permitted = function(action) {
  if (action === 'admin') {
    return this._level >= USER_LEVEL.ADMIN
  }
  if (action === 'super') {
    return this._level >= USER_LEVEL.SUPER
  }
  return false
}

User.prototype.isSuper = function() {
  return this.permitted('super')
}


/**
 * Get user's role on given media
 */
User.prototype.mediaRole = function *(media_id) {
  if (user._roles) {
    return user._roles[media_id]
  }
  var MediaAdmin = require_('models/media/admin')
  var admin = yield MediaAdmin.get(media_id, this.id)
  if (!admin) {
    return null
  }
  return admin.role
}

/**
 * Fetch media admins
 */
User.prototype.admins = function *(with_media) {
  var runner = db.models.media_admin.findByUser(this.id)
  if (with_media !== false) {
    runner = runner.attach('media')
  }
  return yield runner
}

User.LEVEL = USER_LEVEL
User.Passport = Passport
User.LEVEL = USER_LEVEL
User.Passport = Passport



