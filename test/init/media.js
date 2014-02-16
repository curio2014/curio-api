var debug = require('debug')('curio:test:init')

var _ = require_('lib/utils')
var User = require_('models/user')
var Media = require_('models/media')
var MediaAdmin = Media.Admin

function addMedia(uid, screenname) {
  return Media.upsert(uid, {
    oid: 'gh_' + uid,
    name: screenname,
  })
}

function addAdmin(media, user, role) {
  return MediaAdmin.upsert(media.id, user.id, { role: role })
}

function mediaGenerater(i) {
  var uid = 'media' + i
  return function *() {
    debug('adding media: %s ...', uid)

    var media = yield addMedia(uid, 'Media No.' + i)
    var user = yield User.get('test' + i)

    var role = Media.ADMIN_ROLES._list[i % 3].value

    yield addAdmin(media, user, role)

    return media
  }
}

exports.fillup = function *(next) {
  yield _.range(1, 100).map(mediaGenerater)

  // Media1 should have multiple admins
  var media1 = yield Media.get('media1')
  var user1 = yield User.get('test1')
  var user2 = yield User.get('test2')

  yield addAdmin(media1, user1, Media.ADMIN_ROLES.CHIEF)
  yield addAdmin(media1, user2, Media.ADMIN_ROLES.EDITOR)
}
