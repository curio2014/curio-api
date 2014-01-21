module.exports = function(app) {

var utils = require('./utils')
var auth = require('./auth')

app.use(utils.flash())
app.use(utils.error())

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
