var db = require_('lib/db')
var User = require_('models/user')
var Media = require_('models/media/media')
var consts = require_('models/consts')

var MediaAdmin = db.model({
  tableName: 'media_admin',
  hasTimestamps: true,
  user: function() {
    return this.belongsTo(User)
  },
  media: function() {
    return this.belongsTo(Media)
  },
})

MediaAdmin.ROLES = consts.MEDIA_ADMIN

MediaAdmin.get = function *(media_id, user_id) {
  if (arguments.length != 2) {
    throw new Error('Must provide media_id & user_id for MediaAdmin get')
  }
  return yield this.findOne({
    media_id: media_id,
    user_id: user_id
  })
}

MediaAdmin.getOrCreate = function *(media_id, user_id) {
  var model = yield this.get(media_id, user_id)
  if (model) {
    return model
  }
  return this.forge({
    media_id: media_id,
    user_id: user_id
  })
}

MediaAdmin.upsert = function *(media_id, user_id, attrs) {
  var model = this.forge({ media_id: media_id, user_id: user_id })
  var fetched = yield model.fetch()
  if (fetched) {
    return fetched.update(attrs, { patch: true })
  }
  model.set(attrs)
  return model.save()
}

MediaAdmin.findByUser = function *(user_id) {
  var collection = yield this.find({ user_id: user_id })
  return collection
}

MediaAdmin.findByMedia = function() {
}

module.exports = MediaAdmin

