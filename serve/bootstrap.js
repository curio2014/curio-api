var pkg = require('../package.json')

module.exports = function *(next) {
  this.body = {
    version: pkg.version,
    session: this.session,
    user: this.req.user
  }
}
