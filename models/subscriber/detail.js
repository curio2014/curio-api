
var Subscriber = require('./index')

Subscriber.registerProps({
  sex: null,
  city: null,
  country: null,
  province: null,
  language: null,
  headimgurl: null,
  subscribe_time: null,
  latlng: null, // result of a REPORT_LOC or LOCATION message
})

Subscriber.hook('afterCreate', function() {
})


/**
 * Ensure advanced properties, if not exist,
 * will fetch from wechat API
 */
Subscriber.prototype.ensureDetails = function* () {
  var existing = yield this.fetchProps()
  if (existing) return
  yield this.getDetails()
}

/**
 * Get detail account info from wechat
 */
Subscriber.prototype.getDetails = function* () {
  var media = yield this.media()
  var wx = media.wx()
  if (!wx) return
  yield wx.getUserInfo(this.oid)
  yield this.saveProps(props)
}
