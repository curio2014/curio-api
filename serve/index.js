module.exports = function(app) {

var utils = require('./utils')
var passport = require('./auth/passport')

app.use(utils.error())
app.use(utils.parseBody())
app.use(utils.flash())

app.use(passport.initialize())
app.use(passport.session())

// router must goes last
app.use(require('koa-trie-router')(app))

app.get('/', require('./misc/bootstrap'))

// server all resources
require('./resources')(app)

}
