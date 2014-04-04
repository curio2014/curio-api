var error = require_('lib/utils/logger').error('subscriber')
var co = require('co')
var Subscriber = require('./index')

Subscriber.registerProps({
  nickname: null,
  sex: null,
  city: null,
  country: null,
  province: null,
  language: null,
  headimgurl: null,
  subscribe_time: null,
  latlng: null, // result of a REPORT_LOC or LOCATION message
})

Subscriber.getter.name = function() {
  return this._name || this.nickname
}

Subscriber.hook('afterInitialize', function() {
  var self = this
  // if user oid exists
  // fetch detailed user info from API
  if (self.oid) {
    co(function *() {
      yield self.ensureDetails()
    })()
  }

})


/**
 * Ensure advanced properties, if not exist,
 * will fetch from wechat API
 */
Subscriber.prototype.ensureDetails = function* () {
  var existing = yield this.fetchProps()
  if (existing) return
  try {
    yield this.getDetails()
  } catch (e) {
    error('Get user info failed: ', e)
  }
}

/**
 * Get detail account info from wechat
 */
Subscriber.prototype.getDetails = function* () {
  var media, props, wx
  media = yield this.load('media')
  wx = media.wx()
  if (!wx) return
  props = yield wx.getUserInfo(this.oid)
  yield this.saveProps(props)
}
