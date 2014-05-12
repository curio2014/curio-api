"use strict";

/**
 * Common Shared rules across all media
 */
var shared_rules = module.exports = []


var Responder = require('./index')
var revive = require('./reviver')

/**
 * Register shared rules
 *
 *    registerRule(rule1, rule2...)
 *
 */
Responder.registerRule = function() {
  shared_rules.push.apply(shared_rules, revive(arguments))
}
