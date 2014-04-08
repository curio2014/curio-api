/**
 * Common Shared rules across all media
 */
var Responder = require('./index')
var revive = require('./reviver')

var shared_rules = []

/**
 * Register shared rules
 *
 *    registerRule(rule1, rule2...)
 *
 */
Responder.registerRule = function() {
  shared_rules.push.apply(shared_rules, revive(arguments))
}


module.exports = shared_rules
