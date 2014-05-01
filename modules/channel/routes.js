var mesa = require_('serve/mesa')
var Channel = require('./channel')

mesa.rest('/medias/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))
  .use('index', function* (next) {
    this.params = {
      media_id: this.params.id
    }
    // always include qrcodeUrl
    this.query.include = 'qrcodeUrl'
    yield next
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
    yield next
  })

mesa.rest('/medias/:id/channels/:channel_id', Resource(Channel))
  .use(mesa.auth.need('mediaAdmin'))
  .use(function *(next) {
    // ID override
    this.params = { id: this.params.channel_id }
    yield next
  })
  .use('read', function* (next) {
    // always include qrcodeUrl
    this.query.include = 'qrcodeUrl'
    yield next
  })

