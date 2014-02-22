var bcrypt = require('bcryptjs')
var thunkify = require('thunkify')

bcrypt.hash = thunkify(bcrypt.hash)
bcrypt.genSalt = thunkify(bcrypt.genSalt)
bcrypt.compare = thunkify(bcrypt.compare)

module.exports = bcrypt

