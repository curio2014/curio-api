var bcrypt = require('bcryptjs')
var db = require_('lib/db')

var SALT_LENGTH = 10

var Passport = db.define('passport', {
  password: String, // password hash
})

Passport.hash = function(passwd) {
  return bcrypt.hashSync(passwd, bcrypt.genSaltSync(SALT_LENGTH))
}
Passport.prototype.compare = function(passwd) {
  return bcrypt.compareSync(passwd, this.password)
}

module.exports = Passport
