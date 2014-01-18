var resource = require_('serve/base/resource')
var User = require_('models/user')
var auth = require_('serve/auth')

module.exports = resource(User)
  //.use(auth.need('super'))
