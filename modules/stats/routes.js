var mesa = require_('serve/mesa')
var stats = require('./models')

mesa.rest('/medias/:id/stats/:stat_name([\\w\\-]+)')
  .use(mesa.auth.need('mediaAdmin'))
  .read(function* (next) {
    this.assert(this.params.stat_name in stats, 404)
    this.body = yield stats[this.params.stat_name](this.params.id, this.query)
  })
