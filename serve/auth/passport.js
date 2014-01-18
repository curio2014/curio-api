var co = require('co')
var passport = require('koa-passport')
var LocalStratege = require('passport-local').Strategy

var User = require_('models/user')

// add Passport Strategies
passport.use(new LocalStratege(
  co(function *(uid, password, done) {
    var user = yield User.get(uid)
    if (!user) return done(null, false)
    var ok = yield user.comparePassword(password)
    if (!ok) return done(null, false)
    return done(null, user)
  })
))

passport.localAuth = passport.authenticate('local')

module.exports = passport

