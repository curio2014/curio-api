var log = require_('lib/utils/logger').log('user')
var validators = require_('lib/utils/validators')
var cached = require_('lib/cached')
var db = require_('lib/db')
var _ = require_('lib/utils')
var consts = require_('models/consts')
var USER_LEVEL = consts.USER_LEVEL

var User = db.define('user', {
  created_at: Date,
  updated_at: Date,
  email: String,
  uid: { type: String, null: false, unique: true },
  name: String,
  desc: String,
})
USER_LEVEL.bind(User, 'level')
User.LEVEL = USER_LEVEL

User.validatesPresenceOf('name')
User.validatesUniquenessOf('uid', {message: 'conflict'})
User.validate('uid', function(err) {
  if (validators.hasUppercase(this.uid)) err()
}, {message: 'must lowercase'})
User.validate('uid', function(err) {
  if (!validators.isWord(this.uid)) err()
}, {message: 'not word'})
//User.validatesUniquenessOf('email', {message: 'conflict'})
//User.validate('email', function(err) {
  //if (!RE_EMAIL.test(this.email)) err()
//}, {message: 'bad'})


module.exports = User

var Passport = require('./passport')
var Media = require_('models/media')


User.getByPassword = function *getByPassword(uid, password) {
  var user = yield User.get(uid)
  if (!user) {
    log('user "%s" doesnt exit', uid)
    return false
  }
  var ok = yield user.comparePassword(password)
  if (!ok) {
    log('user "%s" password missmatch.', uid)
    return false
  }
  return user
}

/**
 * set password for user directly, will not validate
 */
User.prototype.setPassword = function *setPassword(password) {
  var password = yield Passport.hash(password)
  return yield Passport.upsert(this.id, { password: password })
}

/**
 * Compare password as a yieldable function
 */
User.prototype.comparePassword = function *comparePassword(raw) {
  var self = this
  var pass = yield Passport.get(self.id)
  if (!pass) {
    return false
  }
  return yield pass.compare(raw)
}


/**
 * Get user's role on given media
 */
User.prototype.mediaRole = function *mediaRole(media_id) {
  var user = this
  if (user._roles) {
    return user._roles[media_id]
  }
  var admin = yield Media.Admin.get(media_id, this.id)
  if (!admin) {
    return null
  }
  user._roles = user._roles || {}
  user._roles[media_id] = admin.role
  return admin.role
}

User.prototype.canAdmin = function *canAdmin(media_id) {
  if (this.permitted('admin')) {
    return true
  }
  return yield this.mediaRole(media_id)
}

/**
 * Fetch media admins
 */
User.prototype.mediaAdmins = function *(with_media) {
  var runner = Media.Admin.findByUser(this.id)
  if (with_media === true) {
    runner = runner.attach('media')
  }
  return yield runner
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

cached.register(User)
User.enableCache('get_', '{_model_}:{0}')
User.enableCache('find_', '{_model_}:{0}')
User.addCacheKey('{_model_}:{uid}')

User.Passport = Passport
