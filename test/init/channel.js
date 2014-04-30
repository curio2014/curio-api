var log = require_('lib/utils/logger').log('test:init')

/**
 * Fillup QR Code Channels
 */
var Media = require_('models/media')
var Channel = require_('modules/channel').Channel

exports.fillup = function* (next) {
  log('Filling up channels...')

  //require_('test/common').bootApp()

  // create channels for last 20 media
  var media = yield Media.get('test')
  var start_scene = yield Channel.nextSceneId(media.id)
  var batch = [], i =  30

  while (i) {
    i -= 1
    batch.unshift({
      media_id: media.id,
      scene_id: start_scene + i
    })
  }
  yield Channel.create(batch)

  log('Fill up Channel done.')
}
