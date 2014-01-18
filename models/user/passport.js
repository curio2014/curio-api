var db = require_('lib/db')
var auth = require_('lib/auth')

var Passport = db.model({
  tableName: 'passport',
  idAttribute: 'user_id',
  set: function(name, value) {
    var args = Array.prototype.slice.call(arguments)
    if (name == 'password') {
      args[1] = auth.crypt(value)
    } else if (name.password) {
      name.password = auth.crypt(name.password)
    }
    return db.proto.set.apply(this, args)
  },
  comparePassword: function(passport) {
    return auth.compare(passport, this.get('password'))
  }
})

module.exports = Passport
