// enable `app.rest` API
// apply the monkey patch
require('./base/app')

var mount = require('koa-mount')
var debug = require('debug')('curio:app')
var conf = require_('conf')
var log = require_('lib/utils/logger').log('app')
var logError = require_('lib/utils/logger').error('app')
var app = require('koa')()

app.debug = debug
app.log = log
app.name = 'curio-api'
app.proxy = true;

if (conf.debug) {
  debug('DEBUG on')
  app.outputErrors = true
  app.use(require('koa-logger')())
}

app.keys = [conf.secret, conf.salt]

app.use(mount('/webot', require('./webot')))
app.use(mount('/wx', require('./wx')))
// must go at last, because it's on the root
app.use(mount('/api', require('./mesa')))

app.curio_modules = require_('modules').all()

app.on('error', function(err, ctx) {
  logError('REQUEST: %j', ctx.request)
  logError(err.stack || err)
})

module.exports = app
