var mesa = require_('serve/mesa')
var Channel = require('./models').Channel

mesa.rest('/media/:id/channels', Collection(Channel))
  .use(mesa.auth.need('mediaAdmin'))

