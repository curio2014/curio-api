var debug = require('debug')('curio:test:fillup_user')

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
  // add super admin
  var admin = yield addUser('super', 'Super Admin', 'super', User.LEVEL.SUPER)

  yield _.range(1, 10).map(function(i) {
    return addUser('test' + i, 'Test ' + i, 'test')
  })
}
