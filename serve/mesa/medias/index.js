"use strict";

var ERRORS = require_('serve/base/consts').ERRORS
var Media = require_('models/media')
var Message = require_('models/message')

var app = require('../index')

app.rest('/medias', Collection(Media))
  // Only super user can create/delete media
  .use(app.auth.need('super'))

app.rest('/medias/:id([\\w\\-]*)', Resource(Media))
  .use(app.auth.need('mediaAdmin'))

app.rest('/medias/:id/messages', Collection(Message))
  .use(app.auth.need('mediaAdmin'))
  .use(function* idOverride(next) {
    this.params = {
      media_id: this.params.id
    }
    yield* next
  })

