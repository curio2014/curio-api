var app = require_('serve/mesa')
var Subscriber = require_('models/subscriber')
var Media = require_('models/media')


app.rest('/medias/:id/subscribers', Collection(Subscriber))
  .use(app.auth.need('mediaAdmin'))
  .use(function* idOverride(next) {
    this.params = {
      media_id: this.params.id
    }
    yield next
  })

app.rest('/medias/:id/subscribers/:subscriber_id', Resource(Subscriber))
  .use(app.auth.need('mediaAdmin'))
  .use(function* idOverride(next) {
    this.params = {
      id: this.params.subscriber_id
    }
    yield next
  })

