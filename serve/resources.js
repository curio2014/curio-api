module.exports = function(app) {

var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

// Exports common utilities as globals
global.rest = require('./base/rest')(app)
global.auth = require('./auth')
global.Resource = require('./base/resource')
global.Collection = require('./base/collection')


var User = require_('models/user')
var Message = require_('models/message')
var Subscriber = require_('models/subscriber')

rest('/auth', auth)

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

delete global.assert
delete global.ERRORS
delete global.rest
delete global.auth
delete global.Resource
delete global.Collection

// the jugglingdb's database migration method
User.schema.autoupdate()

}
