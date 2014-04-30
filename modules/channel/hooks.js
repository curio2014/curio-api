var debug = require_('lib/utils/logger').debug('channel')
var co = require('co')

var Responder = require_('models/responder')
var Channel = require('./channel')


Responder.registerRule({
  name: 'unsubscribed scan',
  pattern: function isUnsubscribedScan(info) {
    return info.is('event') &&
           info.param.event == 'subscribe' &&
           info.param.eventKey
  },
  handler: '$tag_qrcene'
}, {
  name: 'subscribed scan',
  pattern: function isSubscribedScan(info) {
    return info.is('event') &&
           info.param.event == 'SCAN'
  },
  handler: '$tag_qrcene'
})

Responder.registerHandler({
  '$tag_qrcene': function addQRCodeTag(info) {
    var scene_id = info.param.eventKey.replace('qrscene_', '')
    if (scene_id) {
      // add scene id as parameter, so when save message content,
      // content.scene_id will exist
      info.scene_id = info.param.scene_id = scene_id
      addChannelTag(info)
    }
  }
})


function addChannelTag(info) {
  if (!info.scene_id) {
    return
  }
  co(function* () {
    var query = {
      media_id: info.media.id,
      scene_id: info.scene_id
    }
    // find the channel, tag user with it
    var channel = yield Channel.upsert(info.media.id, info.scene_id)
    debug('Tag user %s with Scene %s', info.subscriber.id, info.scene_id)
    channel.tagUser(info.subscriber)
  })()
}
