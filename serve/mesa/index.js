"use strict";
var User = require_('models/user')
var auth = require('./auth')
var passport = require('./auth/passport')

var app = require('koa')()

module.exports = app

// load middlewares
require('./middlewares')

app.get('/', require('./misc/bootstrap'))
app.rest('/auth', Resource(require('./auth/handlers')))
  .use('create', passport.authenticate('local'))

// Only super user can create/delete user
app.rest('/users', Collection(User))
  .use(auth.need('super'))
  .use('create', function* (next) {
    var data = this.req.body
    yield* next
    // save password after user is saved
    if (this.item && data.password) {
      yield this.item.setPassword(data.password)
    }
  })

// Only super user or self can view/edit user
app.rest('/users/:id([\\w\\-]*)', Resource(User))
  .use(auth.need('login'))
  .use(auth.need('self'))

app.rest('/passports/:id', Resource(User.Passport))
  .use(auth.need('login'))
  .use(auth.need('self'))

require('./medias')

