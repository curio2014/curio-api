/**
 * Auto reply rule for webot
 */
var log = require('debug')('curio:responder')
var db = require_('lib/db')
var sandbox = require_('lib/sandbox')
var _ = require_('lib/utils')
var consts = require_('models/consts')

var Responder = db.define('responder', {
  name: String,
  pattern: String,
  handler: String,
  priority: Number
})

Responder.defaultOrder = 'sequece asc'
Responder.defaultLimit = null // just dump all rules

Responder.belongsTo('media', {foreignKey: 'media_id'})

Responder.findByMedia = Responder.finder('media_id')

Responder.setter.pattern = function(value) {
  this._pattern = JSON.stringify(value, replacer)
}
Responder.setter.handler = function(value) {
  this._handler = JSON.stringify(value, replacer)
}


/**
 * Convert this responder to a webot rule,
 * with proper context attached
 */
Responder.prototype.revive = function(ctx) {
  var reviver = reviverFor(ctx)
  return {
    name: 'rule_' + this.priority,
    pattern: JSON.parse(this.pattern, reviver),
    handler: JSON.parse(this.handler, reviver),
  }
}



function reviverFor(ctx) {
  return function reviver(k, v) {
    if (v && v.pickled) {
      try {
        return sandbox(ctx, value)
      } catch (e) {
        log('Unpickle %j failed', v)
      }
    }
    return v
  }
}

function replacer(k, v) {
  if (v instanceof RegExp) {
    return {
      pickled: 'regexp',
      value: v.toString()
    }
  }
  if ('function' == typeof v) {
    return {
      pickled: 'function',
      value: v.toString()
    }
  }
  return v
}

module.exports = Responder


