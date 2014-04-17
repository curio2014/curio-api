var mesa = require_('serve/mesa')
var Responder = require_('models/responder')
var ERRORS = require_('models/errors')

mesa.rest('/medias/:id/responder')
  .use(mesa.auth.need('mediaAdmin'))
  .get(function* getResponder() {
      this.body = yield Responder.get(this.params.id)
  })
  .post(function* updateResponder() {
    var responder = new Responder(this.req.body)
    this.assert(responder.validate(), ERRORS.BAD_REQUEST, responder.errors)
    yield responder.save()
    this.body = { ok: true }
  })

