var pkg = require_('package.json')
var MediaAdmin = require_('models/media/admin')

module.exports = function *(next) {
  var user = this.req.user
  var admins
  if (user) {
    admins = yield MediaAdmin.findByUser(user.id)
    admins = admins.map(function(item) {
      return {
        media_id: item.media_id,
        role: item.role,
      }
    })
  }
  this.body = {
    version: pkg.version,
    admins: admins,
    user: this.req.user
  }
};
