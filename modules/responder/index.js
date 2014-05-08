var mesa = require_('serve/mesa')
var Responder = require_('models/responder')
var Media = require_('models/media')
var ERRORS = require_('models/errors')

mesa.rest('/medias/:id/responder')
  .use(mesa.auth.need('mediaAdmin'))
  .use(function* checkMediaExist(next) {
    this.media = yield Media.get(this.params.id)
    this.assert(this.media, 404)
    yield* next
  })
  .get(function* getResponder() {
    this.body = yield Responder.get(this.params.id)
  })
  .post(function* updateResponder() {
    var responder = new Responder(this.req.body)
    this.assert(responder.validate(), ERRORS.BAD_REQUEST, responder.errors)
    yield responder.save()
    this.body = { ok: true }
  })

