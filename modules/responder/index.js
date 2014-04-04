var mesa = require_('serve/mesa')
var Responder = require_('models/responder')

mesa.rest('/medias/:id/responder')
  .use(mesa.auth.need('mediaAdmin'))
  .read(function* () {
      this.body = yield Responder.get(this.params.id)
  })
