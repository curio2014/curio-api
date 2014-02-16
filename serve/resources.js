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
var Media = require_('models/media')

rest('/auth', auth)

// Only super user can create/delete media
rest('/medias', Collection(Media))
.use(auth.need('super'))

rest('/medias/:id(\\w+)', Resource(Media))
.use(auth.need('super'))

// Only super user can create/delete user
rest('/users', Collection(User))
.use(auth.need('login'))
.use('write', auth.need('super'))

// Only super user or self can view/edit user
rest('/users/:id', Resource(User))
.use(auth.need('login'))
.use(function *(next) {
  user = this.req.user
  user_id = this.params.id
  assert(user.isSuper() || user.id == user_id, 403, ERRORS.NOT_ALLOWED)
})

rest('/messages', Collection(Message))
rest('/messages/:id', Resource(Message))

rest('/webot/:media_id', require('./webot'))


// the jugglingdb's database migration method
User.schema.autoupdate()

}
