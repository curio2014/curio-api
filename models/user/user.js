var db = require_('lib/db')
var consts = require_('models/consts')
var Passport = require('./passport')

var SALT_LENGTH = 10
var USER_LEVEL = consts.USER_LEVEL

var User = db.model({
  tableName: 'user',
  hasTimestamps: true,
  passport: function() {
    return this.hasOne(Passport)
  },
})

User.prototype.virtuals = {
  privilege: {
    get: function() {
      return USER_LEVEL.byId(this.get('level')).name
    },
    set: function(value) {
      return this.set('level', USER_LEVEL.byName(value).value)
    }
  }
}

User.prototype.setPassword = function *(password) {
  var pass = this.passport()
  var fetched = yield pass.fetch()
  if (fetched) {
    return fetched.save({ password: password }, { patch: true })
  } else {
    pass.set('password', password)
    return pass.save()
  }
}


/**
 * Compare password as a yieldable function
 */
User.prototype.comparePassword = function(raw) {
  return function *(next) {
    var pass = yield this.passport().fetch()
    return pass.comparePassword(raw)
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
