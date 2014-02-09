var pkg = require_('package.json')
var Media = require_('models/media')

module.exports = function *(next) {
  var user = this.req.user
  var admins
  if (user) {
    admins = yield user.admins()
  }
  this.body = {
    version: pkg.version,
    admins: admins,
    user: this.req.user
  }
};
