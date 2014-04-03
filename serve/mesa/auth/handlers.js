var assert = require_('serve/base/utils').assert
var passport = require('./passport')

var handlers = {}

handlers.index = function *authGET(next) {
  var user = this.req.user
  this.body = {
    ok: true,
    user: user
  }
}

handlers.create = [passport.authenticate('local'), function* (next) {
  this.body = {
    user: this.req.user,
    admins: yield this.req.user.mediaAdmins(true)
  }
}]

handlers.destroy = function *authDELETE() {
  // with passport initialized, we will have a logout functionn here
  this.req.logout()
  this.body = {
    ok: true
  }
}

module.exports = handlers
