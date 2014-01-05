var app = require('koa')()
var common = require('koa-common')
var session = require('koa-sess')
var redisStore = require('koa-redis')
var assert = require('http-assert')
var debug = require('debug')('curio:app')
var conf = require('./conf')

app.debug = debug
app.name = 'curio-api'
app.keys = [conf.key1, conf.key2]
app.proxy = true;

if (conf.debug) {
  app.outputErrors = true;
  app.use(require('koa-logger')())
  app.use(require('koa-etag')())
}

app.use(
  session({
    store: redisStore(conf.session)
  })
)


// load controllers
require('./serve')(app)

module.exports = app
