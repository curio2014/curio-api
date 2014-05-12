"use strict";

var debug = require_('lib/utils/logger').debug('webot')
var Responder = require_('models/responder')
var Media = require_('models/media')
var Webot = require('weixin-robot').Webot
var cache = require('lru-cache')({
  max: 20,
})

// Just silent any errors
Webot.prototype.codeReplies = {
  '404': '',
  '500': ''
}


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

function* loadResponders(media, robot) {
  // custom respond rules
  var responder = yield media.load('responder')
  if (responder) {
    responder.rules().forEach(function(item) {
      //console.log(item)
      robot.set(item)
    })
  }
}

/**
 * Clear cache, call this after reponder update
 */
Webot.purge = function(media_id) {
  debug('clear webot cache for %s', media_id)
  cache.del(media_id)
}

Webot.get = function* (media) {
  if (!(media instanceof Media)) {
    media = yield Media.get(media)
    if (!media) {
      return null
    }
  }
  var media_id = media.id
  var robot = cache.get(media_id)
  if (robot) {
    debug('got webot %s from cache', media_id)
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
  // just so you can:
  //   yield webot.reply(info)
  return function(next) {
    self.reply_(info, function(err, info) {
      if (err) return next(err)
      next(null, self.formatReply(info))
    })
  }
}

module.exports = Webot
