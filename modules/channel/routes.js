var mesa = require_('serve/mesa')
var Channel = require('./models').Channel

mesa.rest('/media/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))

mesa.rest('/media/:id/channels/:channel_id', Resource(Channel))
  .use(mesa.auth.need('mediaAdmin'))
