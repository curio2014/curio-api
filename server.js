var app = require('./app')

function boot() {
  var conf = require('./conf')
  var server = app.listen(conf.port)
  app.debug('Listening at ' + conf.port + ', url: ' + conf.root)
}

if (!module.parent) {
  boot()
}
