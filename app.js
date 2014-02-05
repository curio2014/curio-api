// define local require as a global
global.require_ = function(path) {
  return require(__dirname + '/' + path)
}

var app = require('koa')()
var cors = require('koa-cors')
var session = require('koa-sess')
var debug = require('debug')('curio:app')
var conf = require_('conf')
var utils = require_('lib/utils')
var redisc =  require_('lib/redis')

app.debug = debug
app.name = 'curio-api'
app.keys = [conf.secret, conf.salt]
app.proxy = true;

if (conf.debug) {
  debug('DEBUG on')
  app.outputErrors = true
  app.use(require('koa-logger')())
  app.use(require('koa-etag')())
}

// cross origin request
app.use(cors({
  methods: 'GET,PUT,HEAD,POST,DELETE',
  credentials: true,
  origin: conf.corsOrigin
}))

app.use(session({ store: redisc() }))

// load controllers
require('./serve')(app)

module.exports = app
