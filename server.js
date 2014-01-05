var app = require('./app')

function boot() {
  var conf = require('./conf')
  var server = app.listen(conf.port);
  app.debug('Listening at ' + conf.port + ', site url: ' + conf.site_url)
}

if (!module.parent) {
  boot()
}
