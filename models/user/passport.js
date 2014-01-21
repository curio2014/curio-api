var db = require_('lib/db')
var auth = require_('lib/auth')

var Passport = db.model({
  tableName: 'passport',
  hasTimestamps: true,
  idAttribute: 'user_id',
  setPassword: function(passwd) {
    this.set('password', auth.crypt(passwd))
  },
  comparePassword: function(passwd) {
    return auth.compare(passwd, this.get('password'))
  }
})

module.exports = Passport
