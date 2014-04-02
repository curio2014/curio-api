/**
 * Wechat advanced API integrations
 */
var Media = require('./index')
var Wechat = require('lib/wechat')
// in memory cache of wx-client
var cache = require('lru-cache')({
  max: 20,
  maxAge: 7200 * 1000 // wechat access_token can only survice 7200 seconds
})

/**
 * Get a wechat API client
 */
Media.prototype.wx = function() {
  var wx = cache.get(this.id)
  if (!wx) {
    wx = Wechat(this.wx_appkey, this.wx_secret)
    cache.set(this.id, wx)
  }
  return wx
}

// for full client API, goto https://github.com/ktmud/wechat-api
