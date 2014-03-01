var co = require('co')

suite('webot response', function() {
  var Webot = require_('models/webot')

  bench('get webot', co(function *() {
    yield Webot.get(1)
  }))
})
