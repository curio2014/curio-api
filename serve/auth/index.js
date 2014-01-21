var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

var User = require_('models/user')
var passport = require('./passport')

exports.get = function *authGET(next) {
  var user = this.req.user
  this.body = {
    ok: true,
    user: user
  }
}

exports.login = function *authPOST() {
  var form = this.req.body

  assert(form.username && form.password, 401, ERRORS.MISSING_FIELD)

  yield passport.localAuth

  assert(this.req.user, 200, ERRORS.LOGIN_FAILED)

  this.body = {
    user: this.req.user
  }
}

exports.logout = function *authDELETE() {
  yield passport.localAuth
  this.body = {
    ok: true
  }
}



/**
 * User privilege middlewares
 */
var checks = {
  login: function *(next) {
    assert(this.user, 401, ERRORS.NEED_LOGIN)
    return yield next
  }
}

exports.need = function(act) {
  if (act in checks) {
    return checks[act]
  }
  checks[act] = function *(next) {
    assert(this.user, 401, ERRORS.NEED_LOGIN)
    assert(this.user.permitted(act), 403, ERRORS.NOT_ALLOWED)
    return yield next
  }
  return checks[act]
}

exports.passport = passport
