var Media = require_('models/media')
var Admin = Media.Admin

function *byMedia() {
}

function *byUser() {
}

module.exports = function *() {
  if (this.params.media_id) {
    yield byMedia(this.params.media_id)
  }
}
