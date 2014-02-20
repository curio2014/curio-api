var log = require_('lib/utils/logger').log('test:init')

var _ = require_('lib/utils')
var User = require_('models/user')

function addUser(uid, screenname, password, level) {
  level = (level === undefined) ? User.LEVEL.NORMAL : level
  return function *() {
    var user = yield User.upsert(uid, { name: screenname, level: level })
    log('added user %s.', uid)
    yield user.setPassword(password)
    return user
  }
}

exports.fillup = function *() {
  log('Filling up users...')

  // add super admin
  var admin = yield addUser('super', 'Super Admin', 'test', User.LEVEL.SUPER)

  yield _.range(0, 30).map(function(i) {
    return addUser('test' + i, 'Test ' + i, 'test')
  })

  log('Fill up user done.')
}
