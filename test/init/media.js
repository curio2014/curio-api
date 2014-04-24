var log = require_('lib/utils/logger').log('test:init')


var _ = require_('lib/utils')
var User = require_('models/user')
var Media = require_('models/media')
var MediaAdmin = Media.Admin

var TEST_ACCOUNT = {
  oid: 'gh_b1a083fb1739',
  name: 'test account',
  wx_token: 'token',
  wx_appkey: 'wx7440bf7ff5f23a1a',
  wx_secret: '972ba827a38121094268724ce0360f67'
}

function addMedia(uid, data) {
  if ('string' == typeof data) {
    data = {
      oid: 'gh_' + uid,
      name: data,
      wx_token: 'token'
    }
  }
  return Media.upsert(uid, data)
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
    var role = Media.Admin.ROLES._list[i % 3].value
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

  var media1 = yield addMedia('test', TEST_ACCOUNT)
  var user1 = yield User.get('test1')
  var user2 = yield User.get('test2')

  if (user1) {
    yield addAdmin(media1, user1, Media.Admin.ROLES.CHIEF)
  }
  if (user2) {
    yield addAdmin(media1, user2, Media.Admin.ROLES.EDITOR)
  }

  log('Fill up media done.')
}
