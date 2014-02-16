var color = require('color')
var thunkify = require('thunkify')
var exec = thunkify(require('child_process').exec)
var Media = require_('models/media')

var msg_args = [
  'text "hello! 你好！这是一条测试信息"'
]
var PORT = 12809

function messageGenerator(media, i) {
  return function(next) {
    var args = ['--port', PORT, '--route', media.webotPath(), '--token', media.wx_token, msg_args[i % 5]]
    var cmd = 'webot send ' + args.join(' ')
    exec(cmd, function(err, stdout, stderr) {
      console.log(cmd.cyan())
      console.log()
      console.log(stdout)
      console.log()
      console.log()
    })
  }
}


exports.fillup = function *(next) {
  var boot = require_('server')
  boot(12808)

  var medias = yield Media.all()

  yield medias.map(messageGenerator)
}
