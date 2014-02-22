var app = require('./app')

function boot(port) {
  var conf = require('./conf')
  port = port || conf.port
  var server = app.listen(port)
  app.debug('Listening at ' + port + ', url: ' + conf.root)
}

module.exports = boot

if (!module.parent) {
  boot()
}
