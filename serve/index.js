// enable `app.rest` API
require('./base/app')

var mount = require('koa-mount')
var debug = require('debug')('curio:app')
var conf = require_('conf')
var app = require('koa')()

app.debug = debug
app.name = 'curio-api'
app.proxy = true;

if (conf.debug) {
  debug('DEBUG on')
  app.outputErrors = true
  app.use(require('koa-logger')())
}

app.keys = [conf.secret, conf.salt]

app.use(mount('/webot', require('./webot')))
app.use(mount('/wechat', require('./pages')))
// must go at last, because it's on the root
app.use(mount('/', require('./mesa')))

module.exports = app
