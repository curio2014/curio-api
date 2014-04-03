/**
 * Common Shared rules across all media
 */
var Responder = require('./index')


var shared_rules = []

/**
 * Register a shared rule
 */
Responder.registerRule = function(rule) {
  shared_rules.push(rule)
}


Responder.prototype.loadShared = function* () {
  // clone
  this._shared = shared_rules.slice()
}


module.exports = shared_rules
