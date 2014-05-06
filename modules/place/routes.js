"use strict";
var _ = require_('lib/utils')
var mesa = require_('serve/mesa')
var Place = require('./place')

mesa.rest('/medias/:id/places', Collection(Place))
  .use(mesa.auth.need('mediaAdmin'))
  .use('index', function* (next) {
    this.params = {
      media_id: this.params.id
    }
    yield next
  })
  .use('create', function* (next) {
    yield next
  })

mesa.rest('/medias/:id/places/:place_id', Resource(Place))
  .use(mesa.auth.need('mediaAdmin'))
  .use(function *(next) {
    // ID override
    this.item = yield Place.get(this.params.place_id)
    this.assert(this.item, 404)
    this.assert(this.item.media_id === this.params.id, 404)
    yield next
  })
