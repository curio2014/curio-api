var co = require('co')
var bcrypt = require_('lib/utils/bcrypt')
var db = require_('lib/db')

var SALT_ROUNDS = 10

var Passport = db.define('passport', {
  password: String, // password hash
})

Passport.validatesLengthOf('password', {min: 6});

// Attention: we overrided the global beforeSave hook here
Passport.beforeSave = function(done, data) {
  var self = this
  co(function *(){
    if (data.password) {
      data.password = yield Passport.hash(data.password)
    }
    done()
  })()
}

Passport.hash = function *(passwd) {
  var salt = yield bcrypt.genSalt(SALT_ROUNDS)
  return yield bcrypt.hash(passwd, salt)
}
Passport.hashSync = function(passwd) {
  var salt = bcrypt.genSaltSync(SALT_ROUNDS)
  return bcrypt.hashSync(passwd, salt)
}

// @async
Passport.prototype.compare = function(passwd) {
  return bcrypt.compare(passwd, this.password)
}

module.exports = Passport
