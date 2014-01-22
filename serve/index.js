module.exports = function(app) {

var parse = require('co-body')
var utils = require('./utils')
var auth = require('./auth')
var ERRORS = require('./consts').ERRORS
var assert = utils.assert

app.use(utils.error())

// parse body and csrf assert
app.use(function *(next){
  if (['POST', 'PUT', 'DELETE'].indexOf(this.method) == -1) return yield next;

  var body

  this.parse = function *() {
    body = yield parse(this)
    return body
  }

  Object.defineProperty(this.req, 'body', {
    get: function() {
      return body || {}
    }
  })

  // parse with default options
  yield this.parse

  return yield next
})

app.use(utils.flash())

app.use(auth.passport.initialize())
app.use(auth.passport.session())

// router must goes last
app.use(require('koa-router')(app))

app.get('/', require('./bootstrap'))
app.get('/auth', auth.get)
app.post('/auth', auth.login)
app.delete('/auth', auth.logout)

app.resource('users', require('./users'))
app.resource('medias', require('./medias'))


}
