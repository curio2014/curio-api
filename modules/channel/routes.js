"use strict";
var _ = require_('lib/utils')
var mesa = require_('serve/mesa')
var Channel = require('./channel')
var Media = require('models/media')

mesa.rest('/medias/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))
  .use('index', function* (next) {
    this.params = {
      media_id: this.params.id
    }
    // always include qrcodeUrl
    this.query = _.assign({ include: 'qrcodeUrl' }, this.query)
    yield* next
  })
  .use('create', function* (next) {
    var data = this.req.body
    // make sure scene id grows
    if (Array.isArray(data)) {
      var n = yield Channel.nextSceneId(data[0].media_id)
      data.forEach(function(item, i) {
        item.scene_id = n + i
      })
    }
    yield* next
  })

mesa.rest('/medias/:id/channels/:channel_id', Resource(Channel))
  .use(mesa.auth.need('mediaAdmin'))
  .use(function *(next) {
    this.media = yield Media.get(this.params.id)
    this.item = yield Channel.get(this.params.channel_id)
    this.assert(this.item, 404)
    this.assert(this.item.media_id == this.media.id, 404)
    yield* next
  })
  .use('read', function* (next) {
    // always include qrcodeUrl
    this.item.qrcodeUrl = yield this.item.load('qrcodeUrl')
    yield* next
  })

