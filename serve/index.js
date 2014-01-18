module.exports = function(app) {

var utils = require('./utils')

app.use(utils.error())

app.use(require('koa-router')(app))


var auth = require('./auth')

app.use(auth.passport.initialize())
app.use(auth.passport.session())

app.get('/', require('./bootstrap'))
app.resource('auth', auth)

app.resource('users', require('./users'))
app.resource('medias', require('./medias'))


}
