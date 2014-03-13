var util = require('util')
var co = require('co')
var log = require('debug')('curio:auth:log')
var User = require_('models/user')
var passport = require('passport')

passport.framework(require('koa-passport-fw'))


function LocalStrategy(verify) {
  passport.Strategy.call(this)
  this.name = 'local'
  this._verify = verify
}

util.inherits(LocalStrategy, passport.Strategy)

LocalStrategy.prototype.authenticate = function(req, options) {
  options = options || {}
  req.user = null // falsy logout first, to prevent later middlewares find a user
  var username = req.body.username
  var password = req.body.password
  if (!username || !password) {
    return this.fail(new Error('Missing credentials'))
  }
  var self = this
  this._verify(username, password, function done(err, user) {
    if (err) return self.error(err)
    if (user) return self.success(user)
    self.fail()
  })
}

// add Passport Strategies
passport.use(new LocalStrategy(co(User.getByPassword)))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})
passport.deserializeUser(User.find_.bind(User))

module.exports = passport

