"use strict";

var pkg = require_('package.json')
var _ = require_('lib/utils')
var Media = require_('models/media')

module.exports = function *(next) {
  var user = this.req.user
  var current = this.query.current
  var admins
  if (user) {
    admins = yield user.load('mediaAdmins', true)
  }
  function isCurrent(item) {
    return item.id === current
  }
  if (current && !_.some(admins, isCurrent) && user.permitted('admin')) {
    current = yield Media.get(current)
    if (current) {
      admins.push({
        media_id: current.id,
        media: current,
        role: -1
      })
    }
  }
  this.body = {
    version: pkg.version,
    admins: admins,
    user: this.req.user
  }
};
