var mesa = require_('serve/mesa')
var Channel = require('./models')

mesa.rest('/medias/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))

mesa.rest('/medias/:id/channels/:channel_id', Resource(Channel))
  .use(mesa.auth.need('mediaAdmin'))

