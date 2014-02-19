var auth = require_('serve/auth')
var Resource = require_('serve/base/resource')
var Collection = require_('serve/base/collection')
var Media = require_('models/media')
var Message = require_('models/message')

var medias = Collection(Media).use(auth.need('super'))
var media = Resource(Media).use(auth.need('mediaAdmin'))

var messages = Collection(Message).use(function *() {
  this.params.media_id = this.params.id
})

module.exports = {
  collection: medias,
  item: media,
  messages: messages
}
