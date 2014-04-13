var mesa = require_('serve/mesa')
var Responder = require_('models/responder')

function* updateResponder() {
  data = this.req.body
  var responder = new Responder(data)
  var valid = responder.validate()
  this.assert(valid, 400, 'bad fields', responder.errors)
  yield responder.save()
  this.body = { ok: true }
}

mesa.rest('/medias/:id/responder')
  .use(mesa.auth.need('mediaAdmin'))
  .get(function* getResponder() {
      this.body = yield Responder.get(this.params.id)
  })
  .post(updateResponder)
