var ERRORS = require_('serve/base/consts').ERRORS
var Media = require_('models/media')
var Message = require_('models/message')
var Subscriber = require_('models/subscriber')

var app = require('../index')

function* idOverride() {
  this.params.media_id = this.params.id
  delete this.params.id
}

app.rest('/medias', Collection(Media))
  // Only super user can create/delete media
  .use(app.auth.need('super'))

app.rest('/medias/:id([\\w\\-]*)', Resource(Media))
  .use(app.auth.need('mediaAdmin'))

app.rest('/medias/:id/messages', Collection(Message))
  .use(app.auth.need('mediaAdmin'))
  .use(idOverride)

app.rest('/medias/:id/subscribers', Collection(Subscriber))
  .use(app.auth.need('mediaAdmin'))
  .use(idOverride)

app.rest('/medias/:id/subscribers/:subscriber_id', Resource(Subscriber))
  .use(app.auth.need('mediaAdmin'))
  .use(function* () {
    this.params = {
      id: this.params.subscriber_id
    }
  })

