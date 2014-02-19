var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

var User = require_('models/user')
var passport = require('./passport')

exports.index = function *authGET(next) {
  var user = this.req.user
  this.body = {
    ok: true,
    user: user
  }
}

exports.create = function *authPOST() {
  var form = this.req.body

  assert(form.username && form.password, 401, ERRORS.MISSING_FIELD)

  yield passport.localAuth

  assert(this.req.user, 200, ERRORS.LOGIN_FAILED)

  this.body = {
    user: this.req.user,
    admins: yield this.req.user.admins()
  }
}

exports.destroy = function *authDELETE() {
  // with passport initialized, we will have a logout functionn here
  this.req.logout()
  this.body = {
    ok: true
  }
}



/**
 * User privilege middlewares
 */
var checks = {
  login: function *(next) {
    assert(this.req.user, 401, ERRORS.NEED_LOGIN)
    if (next) yield next
  },
  mediaAdmin: function *(next) {
    var user = this.req.user
    assert(user, 401, ERRORS.NEED_LOGIN)
    if (!Array.isArray(user.mediaAdmins)) {
      yield user.load('mediaAdmins')
    }
    assert(user.mediaAdmins.length || user.permitted('admin'), 403, ERRORS.NOT_ALLOWED)
    if (next) yield next
  }
}

exports.need = function(act) {
  if (act in checks) {
    return checks[act]
  }
  // cache the middleware
  checks[act] = function *(next) {
    assert(this.req.user, 401, ERRORS.NEED_LOGIN)
    assert(this.req.user.permitted(act), 403, ERRORS.NOT_ALLOWED)
    if (next) yield next
  }
  return checks[act]
}
