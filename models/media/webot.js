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
 * (this is async, don't forget `yield`)
 */
Media.fetcher.responder = function() {
  return Responder.get(this.id)
}
