var log = require_('lib/utils/logger').log('test:init')

require('colors')

var _ = require_('lib/utils')
var thunkify = require('thunkify')
var exec = require('child_process').exec
var Media = require_('models/media')

var msg_args = [
  'text "hello! 你好！这是一条测试信息"',
  'text "function test"',
  'text Hello',
  'text news1',
  'text news2',
  'text news3',
  'text "abc is a good name"',
  'image http://www.baidu.com/img/bdlogo.gif',
  'event click Hello',
  'event subscribe',
  'event unsubscribe',
  'scan 1', // scan when not subscribed
  'scan 1 true', // scan when subscribed
  'scan 2 true',
  'loc 39.941004 116.41680 "This is a label"',
  // subscriber for test account
  '--user oYAmguC1RY9LPzCxUBflv5n3kyqs scan 2',
  '--user oYAmguC1RY9LPzCxUBflv5n3kyqs scan 1',
  '--user oYAmguC1RY9LPzCxUBflv5n3kyqs event subscribe',
  '--user afasfaBlahBlah image http://www.baidu.com/img/bdlogo.gif',
  '--user 29agmh0s823ht12t9aWakaka image http://www.baidu.com/img/bdlogo.gif',
  '--user Wahaha event subscribe',
]

var PORT = require_('conf').port

function messageGenerator(media, i) {
  var args = ['--port', PORT, '--route', media.webotPath(), '--token', media.wx_token].join(' ')
  return _.shuffle(msg_args).map(function(arg) {
    var cmd = 'webot send ' + args + ' ' + arg
    return function(next) {
      exec(cmd, next)
    }
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
