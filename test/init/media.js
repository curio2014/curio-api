var log = require_('lib/utils/logger').log('test:init')


var _ = require_('lib/utils')
var User = require_('models/user')
var Media = require_('models/media')
var MediaAdmin = Media.Admin

function addMedia(uid, screenname) {
  return Media.upsert(uid, {
    oid: 'gh_' + uid,
    name: screenname,
    wx_token: 'token'
  })
}

function addAdmin(media, user, role) {
  return MediaAdmin.upsert(media.id, user.id, { role: role })
}

function mediaGenerater(i) {
  var uid = 'media' + i
  return function *generateMedia() {
    var user = yield User.get('test' + (i % 20))
    var media = yield addMedia(uid, 'Media No.' + i)
    log('added media: %s', uid)
    var role = Media.ADMIN_ROLES._list[i % 3].value
    if (!user) {
      return
    }
    var admin = yield addAdmin(media, user, role)
    log('added media admin: %s -> %s, as %s', user.uid, media.uid, admin.role)
    return media
  }
}

exports.fillup = function *(next) {
  log('Filling up media...')

  yield _.sleep(.1) // avoid databae still connecting memory leak

  yield _.range(1, 60).map(mediaGenerater)

  // Media1 should have multiple admins
  var media1 = yield Media.get('media1')
  var user1 = yield User.get('test1')
  var user2 = yield User.get('test2')

  if (user1) {
    yield addAdmin(media1, user1, Media.ADMIN_ROLES.CHIEF)
  }
  if (user2) {
    yield addAdmin(media1, user2, Media.ADMIN_ROLES.EDITOR)
  }

  log('Fill up media done.')
}
