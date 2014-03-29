var app = require('./index')

var conf = require_('conf')
var utils = require_('lib/utils')
var redisc =  require_('lib/redis')
var RedisStore = require('koa-redis')

app.use(require('koa-etag')())
//app.use(require('koa-cors')({
  //methods: 'GET,PUT,HEAD,POST,DELETE,OPTIONS',
  //headers: 'accept, x-csrf-token, content-type',
  //credentials: true,
  //origin: conf.corsOrigin
//}))
app.use(require('koa-sess')({
  store: new RedisStore({
    prefix: conf.sessionStore.prefix + 'mesa:',
    client: redisc
  })
}))


var utils = require_('serve/base/utils')
var passport = require('./auth/passport')

app.use(utils.error())
app.use(utils.parseBody())
app.use(utils.flash())

app.use(passport.initialize())
app.use(passport.session())

// router must goes last
app.use(require('koa-trie-router')(app))

// Authenticate helpers
app.auth = require('./auth')

// Auto update database, remove this when in production
// use `db-migrate` instead
var schema = require_('models/user').schema
schema.isActual(function(err, actual) {
  // the jugglingdb's database migration method
  if (!actual) {
    schema.autoupdate()
  }
})

