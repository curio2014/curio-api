/**
 * Sync Subscriber list with wechat server
 */
var Media = require_('models/media')
var Subscriber = require_('models/subscriber')
var utils = require_('lib/utils')

module.exports = function* (options) {
  var media = yield Media.get(options.media_id)
  if (!media) {
    throw new Error('Media not found')
  }
  var wx = media.wx()
  if (!wx) {
    throw new Error('Media wx api not configured')
  }

  var ids, result, existing, inserting
  var next_openid = ''

  function transform() {
  }

  while (next_openid) {

    result = yield wx.getUserList({ next_openid: next_openid, count: 10000, })
    // for next page
    next_openid = result.next_openid || null
    ids = result.data && result.data.openid

    // error parsing data
    if (!ids) {
      throw new Error('Got invalid data: ' + JSON.stringify(result))
    }
    if (!ids.length) {
      break
    }

    // get an existing mapping
    existing = yield Subscriber.all({
      where: {
        media_id: media.id,
        oid: { 'in': ids },
      }
    })

    // this page all existing, don't get remaing
    if (existing.length == ids.length && !options.all) {
      break
    }

    inserting = []
    ids.forEach(function(oid) {
      if (oid in existing) {
        inserting.push({
          media_id: media.id,
          oid: oid
        })
      }
    })

    if (inserting.length) {
      // builk insert existing subscribers
      yield Subscriber.create(data)
    }
    yield utils.sleep(1)
  }
}
