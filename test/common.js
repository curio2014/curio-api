"use strict";
var path_ = require('path')

// application level absolute require
global.require_ = function(path) {
  return require(path_.join(__dirname, '../', path))
}

/**
 * Bootup the test server
 */
var bootedPort

exports.bootApp = function() {
  var port = require('../conf').port
  if (bootedPort !== port) {
    require('../app')(port)
    bootedPort = port
  }
}

