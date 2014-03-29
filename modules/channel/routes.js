var mesa = require_('serve/mesa')
var pages = require_('serve/pages')
var Channel = require('./models')

mesa.rest('/media/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))

mesa.rest('/media/:id/channels/:channel_id', Resource(Channel))
  .use(mesa.auth.need('mediaAdmin'))

