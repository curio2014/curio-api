var ERRORS = require_('serve/base/consts').ERRORS

var User = require_('models/user')

/**
 * User privilege middlewares
 */
var checks = {
  login: function* requireLogin(next) {
    this.assert(this.req.user, 401, ERRORS.NEED_LOGIN)
    yield* next
  },
  mediaAdmin: function* requireMediaAdmin(next) {
    var user = this.req.user
    var media_id, role

    // Must logged in
    this.assert(user, 401, ERRORS.NEED_LOGIN)

    media_id = this.params.media_id || this.params.id
    role = yield this.req.user.canAdmin(media_id)

    this.assert(role, 403, ERRORS.NOT_ALLOWED)
    yield* next
  },
  self: function *(next) {
    user = this.req.user
    user_id = this.params.id || this.params.user_id
    this.assert(user.isSuper() || user.id == user_id, 403, ERRORS.NOT_ALLOWED)
    yield* next
  }
}

exports.checks = checks

exports.need = function(act) {
  if (act in checks) {
    return checks[act]
  }
  // cache the middleware
  checks[act] = function* checkPermission(next) {
    this.assert(this.req.user, 401, ERRORS.NEED_LOGIN)
    this.assert(this.req.user.permitted(act), 403, ERRORS.NOT_ALLOWED)
    yield* next
  }
  return checks[act]
}
