var mesa = require_('serve/mesa')
var stats = require('./models')

var stats_view = {}

stats_view.read = function* () {
  this.assert(this.params.stat_name in stats, 404)
  this.body = yield stats[this.params.stat_name](this.params.id, this.query)
}

mesa.rest('/medias/:id/stats/:stat_name([\\w\\-]+)', Resource(stats_view))
  .use(mesa.auth.need('mediaAdmin'))
