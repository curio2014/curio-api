var debug = require_('lib/utils/logger').debug('webot')
var Responder = require('./responder')
var Media = require('./media')
var Webot = require('weixin-robot').Webot
var cache = require('lru-cache')({
  max: 20,
})

// webot rule pattern arrays as `or`
//if (Array.isArray(item.pattern)) {
  //var pattern = item.pattern
  //item.pattern = function(info) {
    //function test(item) {
      //if (item instanceof RegExp) {
        //return item.test(info.text)
      //}
      //for (var k in item) {
        //if (info[k] != item[k]) {
          //return false
        //}
      //}
      //return true
    //}
    //return _.any(pattern, test)
  //}
//}


function *loadResponders(media, robot) {
  // common respond rules goes here:
  // Event, channel, subscribe, unsubscribe, etc...

  // custom respond rules
  yield media.load('responder')
  var responder = media.responder
  robot.set(media, robot, responder)
  if (responder) {
    responder.webotfy().forEach(function(item) {
      robot.set(item)
    })
  }
}

Webot.get = function *(media) {
  if (!(media instanceof Media)) {
    media = yield Media.get(media)
    if (!media) {
      return null
    }
  }
  var media_id = media.id
  var robot = cache.get(media_id)
  if (robot) {
    return robot
  }
  debug('webot cache miss: %s', media_id)
  robot = new Webot()

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
