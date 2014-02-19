module.exports = function(app) {

var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

var rest = require('./base/rest')(app)
var auth = require('./auth')
var Resource = require('./base/resource')
var Collection = require('./base/collection')
var User = require_('models/user')
var Message = require_('models/message')

rest('/auth', auth)

var medias = require('./medias')
// Only super user can create/delete media
rest('/medias', medias.collection)
rest('/medias/:id(\\w+)', medias.item)
rest('/medias/:id/messages', medias.messages)

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

var MessageCollection = Collection(Message)
rest('/messages', MessageCollection)
rest('/messages/:id', Resource(Message))

rest('/webot/:media_id', require('./webot'))


// the jugglingdb's database migration method
User.schema.autoupdate()

}
