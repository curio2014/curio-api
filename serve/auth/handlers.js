var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS
var passport = require('./passport')
var localAuth = passport.authenticate('local')

exports.index = function *authGET(next) {
  var user = this.req.user
  this.body = {
    ok: true,
    user: user
  }
}

exports.create = function *authPOST(next) {
  var form = this.req.body

  assert(form.username && form.password, 401, ERRORS.MISSING_FIELD)

  yield localAuth

  assert(this.req.user, 200, ERRORS.LOGIN_FAILED)

  this.body = {
    user: this.req.user,
    admins: yield this.req.user.mediaAdmins(true)
  }
}

exports.destroy = function *authDELETE() {
  // with passport initialized, we will have a logout functionn here
  this.req.logout()
  this.body = {
    ok: true
  }
}

exports = Resource(exports)


rest('/auth', exports)
