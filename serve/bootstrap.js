var pkg = require_('package.json')

module.exports = function *(next) {
  this.body = {
    version: pkg.version,
    user: this.req.user
  }
};
