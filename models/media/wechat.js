/**
 * Wechat advanced API integrations
 */
var Media = require('./index')
var Wechat = require_('lib/wechat')
// in memory cache of wx-client
var cache = require('lru-cache')({
  max: 20,
  maxAge: 7200 * 1000 // wechat access_token can only survice 7200 seconds
})

Media.hook('afterUpdate', function(next) {
  cache.del(this.id)
  next()
})

/**
 * Get a wechat API client
 */
Media.prototype.wx = function() {
  if (!this.wx_appkey || !this.wx_secret) {
    return
  }
  var wx = cache.get(this.id)
  if (!wx) {
    wx = Wechat(this.wx_appkey, this.wx_secret)
    cache.set(this.id, wx)
  }
  return wx
}

// for full client API, goto https://github.com/ktmud/wechat-api


// check appkey and secret against wechat api
Media.validateAsync('wx_appkey', function(error, done) {

  // an in-memory cache contains exsiting key/secret info
  // so we must delete it first
  cache.del(this.id)

  var wx = this.wx()
  // left these two field blank is actually allowed
  if (!wx) {
    return done()
  }
  wx.refreshToken(function(e) {
    if (e) {
      // You don't have to `return error`
      // jugglingdb's validate async is very funny
      error(e.errmsg)
    }
    done()
  })
}, {
  message: {
    'invalid appid': 'invalid',
    'invalid credential': 'secret'
  }
})
