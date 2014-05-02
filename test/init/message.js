var send = require('webot-cli').commands.send
var log = require_('lib/utils/logger').log('test:init')
var _ = require_('lib/utils')
var Media = require_('models/media')

require('colors')

var msg_args = [
  'hello! 你好！这是一条测试信息',
  'function test',
  'Hello',
  'news1',
  'news2',
  'news3',
  'abc is a good name',
  ['image', 'http://www.baidu.com/img/bdlogo.gif'],
  ['event', 'click', 'Hello'],
  ['event', 'subscribe'],
  ['event', 'unsubscribe'],
  ['scan', '1'], // scan when not subscribed
  ['scan', '1', true], // scan when subscribed
  ['scan', '2', true],
  ['loc', '39.941004', '116.41680', 'This is a label'],
  ['reportloc', '39.941004', '116.41680'],
]

var PORT = require_('conf').port
var oids = ['oYAmguC1RY9LPzCxUBflv5n3kyqs', '92bafofa12tf', 'm31tibasfa012kt1gazta']

function messageGenerator(media, i) {
  var common = {
    silent: true,
    port: PORT,
    route: media.webotPath(),
    token: media.wx_token
  }
  return oids.map(function(oid) {
    return _.shuffle(msg_args).map(function(arg) {
      if ('string' == typeof arg) {
        arg = ['text', arg]
      }
      var opts = _.assign({}, common, { user: oid, input: arg })
      return function(next) {
        send(opts, next)
      }
    })
  })
}

exports.benchfill = function *(next) {
  log('Filling up many many messages...')
  require_('test/common').bootApp()

  var medias = yield Media.all({ limit: 2, order: 'id desc' })
  var fns = _(medias.map(messageGenerator)).flatten().shuffle().value()

  fns = fns.concat(fns, fns, fns, fns, fns)

  for (var i = 0, l = fns.length; i < l;) {
    yield fns.slice(i, i + 30)
    i += 1
  }

  yield _.sleep(3)

  log('Fill up message done.')
}

exports.fillup = function *(next) {
  log('Filling up message...')

  require_('test/common').bootApp()

  var medias = yield Media.all({ limit: 5, order: 'id desc' })
  var fns = _(medias.map(messageGenerator)).flatten().shuffle().value()

  log('Found %s medias...', medias.length)

  for (var i = 0, l = fns.length; i < l;) {
    yield fns.slice(i, i += 30)
    log('sent messages %s~%s..', i-30, i)
  }

  yield _.sleep(3)

  log('Fill up message done.')
}
