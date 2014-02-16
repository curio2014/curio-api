var Media = require('./index')
var Responder = require_('models/responder')

/**
 * Where should the weixin-robot listens to
 */
Media.prototype.webotPath = function() {
  return '/webot/' + this.uid
}

/**
 * Load rules and save it to memory cache
 */
Media.fetcher.responders = function *() {
}
