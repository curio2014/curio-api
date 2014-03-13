var ERRORS = require_('serve/base/consts').ERRORS
var Media = require_('models/media')
var Message = require_('models/message')
var Subscriber = require_('models/subscriber')

var app = require('../index')

var media, medias, messages, subscribers, subscriber

function *checkPermission() {
  var role = yield this.req.user.canAdmin(this.params.id)
  this.assert(role, 403, ERRORS.NOT_ALLOWED)
}
function *idOverride() {
  this.params.media_id = this.params.id
  delete this.params.id
}

medias = Collection(Media)
  .use(app.auth.need('super'))

// Only super user can create/delete media
media = Resource(Media)
  .use(app.auth.need('mediaAdmin'))
  .use(checkPermission)

messages = Collection(Message)
  .use(checkPermission)
  .use(idOverride)

subscribers = Collection(Subscriber)
  .use(checkPermission)
  .use(idOverride)

subscriber = Resource(Subscriber)
  .use(checkPermission)
  .use(function *() {
    this.params.media_id = this.params.id
    // still, get subscriber by id
    this.params.id = this.params.subscriber_id
  })

app.rest('/medias', medias)
app.rest('/medias/:id(\\w+)', media)
app.rest('/medias/:id/messages', messages)
app.rest('/medias/:id/subscribers', subscribers)
app.rest('/medias/:id/subscribers/:subscriber_id', subscriber)
