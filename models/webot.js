var debug = require('debug')('curio:webot')
var Responder = require('./responder')
var Media = require('./media')
var Webot = require('weixin-robot').Webot
var cache = require('NodeSimpleCacheManage/Cache').createCache('LRU', 20)


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


function *loadResponders(media_id, robot) {
  // common respond rules goes here:
  // Event, channel, subscribe, unsubscribe, etc...

  // custom respond rules
  var item = yield Responder.load(media_id)
  if (item) {
    item.webotfy().forEach(function(item) {
      robot.set(item)
    })
  }
}

Webot.get = function *(media_id) {
  var robot = cache.get(media_id)
  if (robot) {
    return robot
  }
  debug('Cache miss: %s', media_id)
  robot = new Webot()

  yield loadResponders(media_id, robot)

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
