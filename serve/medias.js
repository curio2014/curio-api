var resource = require_('serve/base/resource')
var Media = require_('models/media')
var auth = require_('serve/auth')

module.exports = resource(Media).use('write', auth.need('login'))

