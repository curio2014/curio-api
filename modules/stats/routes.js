var mesa = require_('serve/mesa')

var stats = Resource({
  read: function* () {
  }
})

mesa.rest('/media/:id/stats/:stat_name([\\w\\-]+)', stats)
  .use(mesa.auth.need('mediaAdmin'))
