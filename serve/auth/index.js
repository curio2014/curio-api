var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

var User = require_('models/user')

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
    var admins = this.mediaAdmins
    assert(user, 401, ERRORS.NEED_LOGIN)
    if (!Array.isArray(admins)) {
      admins = this.mediaAdmins = yield user.mediaAdmins()
    }
    assert(admins.length || user.permitted('admin'), 403, ERRORS.NOT_ALLOWED)
    if (next) yield next
  },
  self: function *() {
    user = this.req.user
    user_id = this.params.id || this.params.user_id
    assert(user.isSuper() || user.id == user_id, 403, ERRORS.NOT_ALLOWED)
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
