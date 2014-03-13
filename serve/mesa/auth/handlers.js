var assert = require_('serve/base/utils').assert
var ERRORS = require_('serve/base/consts').ERRORS
var passport = require('./passport')
var localAuth = passport.authenticate('local')

var handlers = {}

handlers.index = function *authGET(next) {
  var user = this.req.user
  this.body = {
    ok: true,
    user: user
  }
}

handlers.create = function *authPOST(next) {
  var form = this.req.body

  assert(form.username && form.password, 401, ERRORS.MISSING_FIELD)

  yield localAuth

  assert(this.req.user, 200, ERRORS.LOGIN_FAILED)

  this.body = {
    user: this.req.user,
    admins: yield this.req.user.mediaAdmins(true)
  }
}

handlers.destroy = function *authDELETE() {
  // with passport initialized, we will have a logout functionn here
  this.req.logout()
  this.body = {
    ok: true
  }
}

module.exports = handlers
