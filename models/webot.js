var Responder = require('./responder')
var Media = require('./media')
var Webot = require('weixin-robot').Webot
var cache = require('NodeSimpleCacheManage/Cache').createCache('LRU', 20)


function *loadResponders(media, robot) {
  var rules = yield Responder.findByMedia(media.id)
  rules.forEach(function(item) {
    robot.set(item.revive())
  })
}

Webot.get = function *(media_id) {
  var robot = cache.get(media_id)
  if (robot) {
    return robot
  }
  var media = yield Media.get(media_id)
  if (!media) {
    return null
  }
  robot = new Webot()
  // assign wechat token to the robot
  robot.wx_token = media.wx_token

  yield loadResponders(media, robot)

  cache.set(media_id, robot)

  return robot
}

Webot.prototype.reply_ = Webot.prototype.reply
Webot.prototype.reply = function(info) {
  var self = this
  return function(next) {
    self.reply_(info, function(err, info) {
      if (err) return next(err)
      next(null, self.formatReply(info))
    })
  }
}

module.exports = Webot
