var debug = require_('lib/utils/logger').debug('channel')
var co = require('co')

var Responder = require_('models/responder')
var Channel = require('./models')


Responder.registerRule({
  name: 'unsubscribed scan',
  pattern: function(info) {
    return info.is('event') &&
           info.param.event == 'subscribe' &&
           info.param.eventKey
  },
  handler: function(info) {
    info.scene_id = info.param.eventKey.replace('qrscene_')
    addChannelTag(info)
  }
})

Responder.registerRule({
  name: 'subscribed scan',
  pattern: function(info) {
    return info.is('event') &&
           info.param.event == 'SCAN'
  },
  handler: function(info) {
    info.scene_id = info.param.eventKey
    addChannelTag(info)
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
    var channel = yield Channel.upsert(info.media.id, info.scene_id)
    channel.tagUser(info.subscriber)
  })()
}
