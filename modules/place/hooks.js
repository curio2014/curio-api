"use strict";

var co = require('co')
var debug = require_('lib/utils/logger').debug('place')

var Responder = require_('models/responder')
var Place = require('./place')


Responder.registerRule({
  pattern: '$location',
  handler: '$search_nearby'
}, {
  pattern: '$report_loc',
  handler: '$silent'
})

Responder.registerHandler({
  '$search_nearby': function* searchNearby(info) {
    var lat = info.param.lat, lng = info.param.lng
    if (lat && lng) {
      var items = yield Place.nearby(lat, lng, { media_id: info.media.id })
      if (items && items.length) {
        return items.map(placeToNews)
      }
      // TODO: Make this customizable, by allowing a custom "location" rule?
      return '暂时搜索不到附近的店铺'
    }
  }
})


function placeToNews(item) {
  return {
    title: item.name,
    url: item.url()
  }
}

