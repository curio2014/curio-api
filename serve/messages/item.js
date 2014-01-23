var Resource = require_('serve/base/resource')
var Message = require_('models/message')

module.exports = Resource(Message)
  //.use(auth.need('super'))
