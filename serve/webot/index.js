"use strict";
/**
 * Wechat API interface, backed by webot
 * see `/app.js`
 */
var wechat = require('koa-wechat')
var app = require('koa')()
var conf = require_('conf')
var Message = require_('models/message')
var Media = require_('models/media')
var Subscriber = require_('models/subscriber')
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

  this.wx_token = media.wx_token

  this.media = media
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
  var req, res, media_id, subscriber_id

  req = this.req.body

  // transform openId to our subscriber
  req.subscriber = yield Subscriber.upsert(req.uid, this.media.id)
  req.session = this.session
  req.media = this.media

  media_id = this.media.id
  subscriber_id = req.subscriber.id

  try {
    // do the reply
    res = yield this.webot.reply(req)
  } catch (e) {
    console.error('Webot reply error:', e)
    if (e.stack) {
      console.error(e.stack)
    }
    res = '' // use empty reply
  }
  if (!isEmpty(res)) {
    // log response
    Message.outgoing(media_id, subscriber_id, res)
    this.body = res
  } else {
    req.flag = true
  }
  // log request
  Message.incoming(media_id, subscriber_id, req)
  yield next
})


function isEmpty(msg) {
  return !msg || (msg.msgType === 'text' && msg.content === '')
}

// an empty handler to prevent any following middlewares
app.use(wechat.close())


module.exports = app
