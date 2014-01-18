// define local require as a global
global.require_ = function(path) {
  return require(__dirname + '/' + path)
}

var app = require('koa')()
var cors = require('koa-cors')
var common = require('koa-common')
var session = require('koa-sess')
var redisStore = require('koa-redis')
var assert = require('http-assert')
var parse = require('co-body')
var debug = require('debug')('curio:app')
var conf = require_('conf')
var utils = require_('lib/utils')

app.debug = debug
app.name = 'curio-api'
app.keys = [conf.secret, conf.salt]
app.proxy = true;

if (conf.debug) {
  app.outputErrors = true
  app.use(require('koa-logger')())
  app.use(require('koa-etag')())
}

app.use(cors({
  methods: 'GET,PUT,HEAD,POST,DELETE',
  credentials: true,
  origin: conf.corsOrigin
}))

app.use(session({
  store: redisStore({
    prefix: conf.redisStore.prefix,
    db: conf.redisStore.database || conf.redis.database,
    pass: conf.redisStore.password || conf.redis.password,
    host: conf.redisStore.host || conf.redis.host,
    port: conf.redisStore.port || conf.redis.port,
  })
}))

app.use(function *(next){
  if ('POST' != this.method) return yield next;
  var body;

  this.parse = function *(opts) {
    if (body === undefined) {
      body = yield parse(this, opts || { limit: '10kb' })
    }
    return body
  }
})

// load controllers
require('./serve')(app)

module.exports = app
