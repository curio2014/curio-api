/**
 * Wechat API interface, backed by webot
 * see `/app.js`
 */
var wechat = require('koa-wechat')
var app = require('koa')()
var conf = require_('conf')
var Message = require_('models/message')
var Media = require_('models/media')
var Webot = require_('models/webot')
var session = require('koa-sess')
var redisc =  require_('lib/redis')
var RedisStore = require('koa-redis')

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
  var webot = yield Webot.get(media)
  if (!webot) {
    this.throw(404)
  }

  this.media_id = media.id
  this.wx_token = media.wx_token
  this.webot = webot

  yield next
})

app.use(wechat())
app.use(session({
  store: new RedisStore({
    prefix: conf.sessionStore.prefix + 'webot:',
    client: redisc
  })
}))

// do the reply
app.use(function *(next) {
  var req, res
  req = this.req.body
  req.session = this.session

  // log request
  Message.incoming(this.media_id, req)
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
