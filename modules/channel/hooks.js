"use strict";
var debug = require_('lib/utils/logger').debug('channel')
var BatchStream = require('batch-stream2')
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
    if (!info.param.eventKey) {
      // break when no key
      return
    }
    var scene_id = info.param.eventKey.replace('qrscene_', '')
    if (scene_id) {
      // add scene id as parameter, so when save message content,
      // content.scene_id will exist
      info.scene_id = info.param.scene_id = scene_id
      addChannelTag(info)
    }
  }
})

var buffer = new BatchStream({
  size: 10,
  timeout: 1000, // try batch write every 2 seconds
  transform: batchSave
})


function batchSave(items, callback) {
  var save = function* () {
    // must be sequential
    for (var k in items) {
      var data = items[k]
      var query = {
        media_id: data.media_id,
        scene_id: data.scene_id
      }
      // find the channel, tag user with it,
      // if not exist, will create one
      var channel = yield Channel.upsert(query.media_id, query.scene_id)
      yield channel.tagUser(data.subscriber)
    }
  }
  co(save)()
}

function addChannelTag(info) {
  if (!info.scene_id) {
    return
  }
  buffer.write({
    subscriber: info.subscriber,
    media_id: info.media.id,
    scene_id: info.scene_id
  })
}
