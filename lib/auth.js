var bcrypt = require('bcryptjs')

var SALT_LENGTH = 10

exports.crypt = function(password) {
  var salt = bcrypt.genSaltSync(SALT_LENGTH)
  return bcrypt.hashSync(password, salt)
}

exports.compare = function(password) {
  return bcrypt.compareSync(password)
}

