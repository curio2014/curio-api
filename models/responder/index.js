/**
 * Auto reply rule for webot
 */
var db = require_('lib/db')
var _ = require_('lib/utils')
var consts = require_('models/consts')

var Responder = db.define('responder', {
  name: String,
  pattern: String,
  handler: String,
  sequece: Number
})

Responder.defaultOrder = 'sequece asc'

Responder.belongsTo('media', {foreignKey: 'media_id'})

Responder.findByMedia = Responder.finder('media_id')

Responder.setter.pattern = function(value) {
  this.pattern = JSON.stringify(value, patternReplacer)
}
Responder.setter.handler = function(value) {
  this.handler = JSON.stringify(value, handlerReplacer)
}


/**
 * Convert this responder to a webot rule
 */
Responder.prototype.revive = function() {
  return {
    name: 'rule_' + this.sequece,
    pattern: JSON.parse(this.pattern, patternReviver),
    handler: JSON.parse(this.handler, handlerReviver)
  }
}

function patternReviver(k, v) {
}
function handlerReviver(k, v) {
}

function patternReplacer(k, v) {
}
function handlerReplacer(k, v) {
}


module.exports = Responder


