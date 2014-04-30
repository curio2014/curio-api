/**
 * Bootup the test server
 */
var bootedPort

exports.bootApp = function() {
  var port = require_('conf').port
  if (bootedPort !== port) {
    require('../app')(port)
    bootedPort = port
  }
}

