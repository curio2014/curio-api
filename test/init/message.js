require('colors')

var _ = require_('lib/utils')
var debug = _.debug('test:init')
var thunkify = require('thunkify')
var exec = require('child_process').exec
var Media = require_('models/media')

var msg_args = [
  'text "hello! 你好！这是一条测试信息"',
  'text "function test"',
  'text Hello --user user2',
  'image http://www.baidu.com/img/bdlogo.gif',
  'image http://www.baidu.com/img/bdlogo.gif --user user3',
  'loc 39.30 124.29 "This is a label"',
  'event click Hello',
  'event subscribe
]
var PORT = 12809

function messageGenerator(media, i) {
  return function(next) {
    var args = ['--port', PORT, '--route', media.webotPath(), '--token', media.wx_token, msg_args[i % 5]]
    var cmd = 'webot send ' + args.join(' ')
    exec(cmd, function(err, stdout, stderr) {
      console.log()
      console.log(stdout)
      console.log()
      next()
    })
  }
}


exports.fillup = function *(next) {
  debug('Filling up message...')

  var boot = require_('server')
  boot(PORT)

  var medias = yield Media.all()

  for (var i = 0, l = medias.length; i < l; i++) {
    yield messageGenerator(medias[i], i)
  }

  yield _.sleep(5)

  debug('Fill up message done.')
}
