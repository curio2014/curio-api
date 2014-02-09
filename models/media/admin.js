var db = require_('lib/db')
var MEDIA_ADMIN = require_('models/consts').MEDIA_ADMIN
var User = require_('models/user')
var Media = require_('models/media')

var MediaAdmin = db.define('media_admin', {
  created_at: Date,
  user_id: { type: Number, null: false, index: true },
  media_id: { type: Number, null: false, index: true },
})
MEDIA_ADMIN.bind(MediaAdmin, 'role')

MediaAdmin.belongsTo('user', {foreignKey: 'user_id'})
MediaAdmin.belongsTo('media', {foreignKey: 'media_id'})

module.exports = MediaAdmin

MediaAdmin.fetcher.media = function *() {
  this.media = yield Media.get(this.media_id)
  return this
}
//MediaAdmin.mfetcher.media = function *(items) {
  //var ids = items.map(function(item) { return item.media_id })
  //// ...
  //return this
//}

MediaAdmin.get = function(media_id, user_id) {
  if (arguments.length != 2) {
    throw new Error('Must provide media_id & user_id for MediaAdmin get')
  }
  return this.findOne({
    where: {
      media_id: media_id,
      user_id: user_id
    }
  })
}

var _upsert = MediaAdmin.upsert
MediaAdmin.upsert = function *(media_id, user_id, props) {
  props = props || {}
  var item = yield this.get(media_id, user_id)
  if (item) {
    return yield item.updateAttributes(props)
  }
  props.media_id = media_id
  props.user_id = user_id
  return yield this.create(props)
}

MediaAdmin.findByUser = function(user_id, options) {
  options = options || {}
  options.where = options.where || {}
  options.where.user_id = user_id
  return this.all(options)
}

MediaAdmin.findByMedia = function(media_id, options) {
  options = options || {}
  options.where = options.where || {}
  options.where.media_id = media_id
  return this.all(options)
}


MediaAdmin.ROLES = MEDIA_ADMIN

