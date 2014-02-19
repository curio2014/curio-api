var debug = require_('lib/utils').debug('test:init')

var _ = require_('lib/utils')
var User = require_('models/user')

function addUser(uid, screenname, password, level) {
  level = (level === undefined) ? User.LEVEL.NORMAL : level
  return function *() {
    debug('adding user %s...', uid)
    var user = yield User.upsert(uid, { name: screenname, level: level })
    yield user.setPassword(password)
    return user
  }
}

exports.fillup = function *() {
  debug('Filling up users...')

  // add super admin
  var admin = yield addUser('super', 'Super Admin', 'test', User.LEVEL.SUPER)

  yield _.range(1, 100).map(function(i) {
    return addUser('test' + i, 'Test ' + i, 'test')
  })

  debug('Fill up user done.')
}
