var debug = require_('lib/utils/logger').debug('channel')
var co = require('co')

var Responder = require_('models/responder')
var Channel = require('./models')


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
    info.scene_id = info.param.eventKey.replace('qrscene_', '')
    if (info.scene_id) {
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
    channel.tagUser(info.subscriber)
  })()
}
