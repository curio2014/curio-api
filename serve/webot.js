/**
 * The webot Application to mount
 */
var wechat = require('koa-wechat')
var app = require('koa')()
var Webot = require_('models/webot')
var session = require('koa-sess')
var redisc =  require_('lib/redis')

// Get the robot
app.use(function *(next) {
  var media_id = this.path.split('/')[1]
  if (!media_id) {
    this.throw(404)
  }
  var webot = yield Webot.get(media_id)
  if (!webot) {
    this.throw(404)
  }
  this.webot = webot
  this.wx_token = webot.wx_token
  yield next
})

app.use(wechat())
app.use(session({ store: redisc('webot:session:') }))

// do the reply
app.use(function *(next) {
  var info = this.req.body
  info.session = this.session
  this.body = yield this.webot.reply(info)
  yield next
})
// an empty handler to prevent any following middlewares
app.use(wechat.close())


module.exports = app
