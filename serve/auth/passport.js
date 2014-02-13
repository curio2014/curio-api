var util = require('util')
var co = require('co')
var log = require('debug')('curio:auth:log')
var passport = require('koa-passport')

var User = require_('models/user')


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
passport.use(new LocalStrategy(co(function *(uid, password) {
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
})))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(User.find_.bind(User))

passport.localAuth = passport.authenticate('local', {})

module.exports = passport

