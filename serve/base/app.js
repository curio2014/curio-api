// The constructor
var Application = require('koa')

module.exports = Application

Application.prototype.assert = require('./utils').assert
Application.prototype.rest = require('./rest')


global.Resource = require('./resource')
global.Collection = require('./collection')

process.nextTick(function() {
  delete global.Resource
  delete global.Collection
})

