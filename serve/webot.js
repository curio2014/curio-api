/**
 * The webot Application to mount
 */
var wechat = require('koa-wechat')
var app = require('koa')()
var Message = require_('models/message')
var Media = require_('models/media')
var Webot = require_('models/webot')
var session = require('koa-sess')
var redisc =  require_('lib/redis')

// Get the robot
app.use(function *(next) {
  var media_id = this.path.split('/')[1]
  if (!media_id) {
    this.throw(404)
  }
  var media = yield Media.get(media_id)
  if (!media) {
    this.throw(404)
  }
  var webot = yield Webot.get(media.id)

  this.media_id = media.id
  this.wx_token = media.wx_token
  this.webot = webot

  yield next
})

app.use(wechat())
app.use(session({ store: redisc('webot:session:') }))

// do the reply
app.use(function *(next) {
  var req, res
  req = this.req.body
  // log request
  Message.incoming(this.media_id, req)
  req.session = this.session
  // do the reply
  res = yield this.webot.reply(req)
  // log response
  Message.outgoing(this.media_id, res)
  this.body = res
  yield next
})
// an empty handler to prevent any following middlewares
app.use(wechat.close())



module.exports = app
