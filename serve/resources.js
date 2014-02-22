module.exports = function(app) {

var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

// Exports common utilities as globals
global.Resource = require('./base/resource')
global.Collection = require('./base/collection')
global.rest = require('./base/rest')(app)
global.auth = require('./auth')


var User = require_('models/user')
var Message = require_('models/message')
var Subscriber = require_('models/subscriber')

require('./auth/handlers')
require('./medias')

// Only super user can create/delete user
rest('/users', Collection(User))
.use(auth.need('super'))

// Only super user or self can view/edit user
rest('/users/:id', Resource(User))
.use(auth.need('login'))
.use(function *() {
  user = this.req.user
  user_id = this.params.id
  assert(user.isSuper() || user.id == user_id, 403, ERRORS.NOT_ALLOWED)
})

//rest('/messages', Collection(Message))
//rest('/messages/:id', Resource(Message))
//rest('/subscribers', Collection(Subscriber))
//rest('/subscribers/:id', Resource(Subscriber))

rest('/webot/:media_id', require('./webot'))

delete global.rest
delete global.auth
delete global.Resource
delete global.Collection

var schema = User.schema
schema.isActual(function(err, actual) {
  // the jugglingdb's database migration method
  if (!actual) {
    schema.autoupdate()
  }
})

}
