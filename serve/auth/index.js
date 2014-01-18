var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

var User = require_('models/user')
var passport = require('./passport')

exports.get = function *(next) {
  if (this.user) {
    this.body = {
      logined: true,
      user: this.user
    }
  } else {
    this.body = {
      logined: false
    }
  }
}

exports.post = function *(next) {
  yield passport.localAuth
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
