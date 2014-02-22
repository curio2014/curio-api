var bcrypt = require_('lib/utils/bcrypt')
var db = require_('lib/db')

var SALT_LENGTH = 10

var Passport = db.define('passport', {
  password: String, // password hash
})

Passport.hash = function *(passwd) {
  var salt = yield bcrypt.genSalt(SALT_LENGTH)
  return yield bcrypt.hash(passwd, salt)
}
// @async
Passport.prototype.compare = function(passwd) {
  return bcrypt.compare(passwd, this.password)
}

module.exports = Passport
