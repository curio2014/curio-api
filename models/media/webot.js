var Media = require('./index')
var Responder = require_('models/responder')

/**
 * Where should the weixin-robot listens to
 */
Media.prototype.webotPath = function() {
  return '/webot/' + this.uid
}

/**
 * Load webot reply rules
 */
Media.fetcher.responder = function() {
  return Responder.load(this.id)
}
