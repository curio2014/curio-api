var User = require_('models/user')
var auth = require('./auth')

var app = require('koa')()

module.exports = app

// load middlewares
require('./middlewares')

app.get('/', require('./misc/bootstrap'))
app.rest('/auth', Resource(require('./auth/handlers')))

// Only super user can create/delete user
app.rest('/users', Collection(User))
  .use(auth.need('super'))

// Only super user or self can view/edit user
app.rest('/users/:id', Resource(User))
  .use(auth.need('login'))
  .use(auth.need('self'))

require('./medias')

