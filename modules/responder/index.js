var mesa = require_('serve/mesa')
var Responder = require_('models/responder')
var ERRORS = require_('models/errors')

function* updateResponder() {
  data = this.req.body
  var responder = new Responder(data)
  var valid = responder.validate()
  this.assert(valid, ERRORS.BAD_REQUEST, responder.errors)
  yield responder.save()
  this.body = { ok: true }
}

mesa.rest('/medias/:id/responder')
  .use(mesa.auth.need('mediaAdmin'))
  .get(function* getResponder() {
      this.body = yield Responder.get(this.params.id)
  })
  .post(updateResponder)
