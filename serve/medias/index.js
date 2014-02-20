var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS
var Media = require_('models/media')
var Message = require_('models/message')
var Subscriber = require_('models/subscriber')

var medias = Collection(Media).use(auth.need('super'))
var media = Resource(Media).use(auth.need('mediaAdmin'))

function *checkPermission() {
  var role = yield this.req.user.canAdmin(this.params.id)
  assert(role, 403, ERRORS.NOT_ALLOWED)
}
function *idOverride() {
  this.params.media_id = this.params.id
}

media.use(checkPermission)

var messages = Collection(Message)
.use(checkPermission)
.use(idOverride)

var subscribers = Collection(Subscriber)
.use(checkPermission)
.use(idOverride)

var subscriber = Resource(Subscriber)
.use(checkPermission)
.use(function *() {
  this.params.media_id = this.params.id
  this.params.id = this.params.subscriber_id
})


// Only super user can create/delete media
rest('/medias', medias)
rest('/medias/:id(\\w+)', media)
rest('/medias/:id/messages', messages)
rest('/medias/:id/subscribers', subscribers)
rest('/medias/:id/subscribers/:subscriber_id', subscriber)
