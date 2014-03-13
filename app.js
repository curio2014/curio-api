//require('gnode')

// define local require as a global
global.require_ = function(path) {
  return require(__dirname + '/' + path)
}

var app = require('./serve')

function boot(port) {
  var conf = require('./conf')
  port = port || conf.port
  var server = app.listen(port)
  app.debug('Listening at ' + port + ', url: ' + conf.root)
}

module.exports = boot

if (!module.parent || ~module.parent.filename.indexOf('/pm2/')) {
  boot()
}
