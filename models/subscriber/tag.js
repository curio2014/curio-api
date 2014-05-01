var db = require_('lib/db')
var Named = require_('lib/named')
var Media = require_('models/media')
var _ = require_('lib/utils')

var TYPES = Named({
  NORM: 0,
})

var SubscriberTag = db.define('subscriber_tag', {
  created_at: Date,
  updated_at: Date,
  media_id: Number,
  object_id: Number, // related object
  name: { type: String, null: false },
  type: TYPES,
})
// for a given media, the tag name is unique
SubscriberTag.SCHEMA_SQL = [
"CREATE UNIQUE INDEX ON subscriber_tag(media_id, name);",
"CREATE UNIQUE INDEX ON subscriber_tag(type, object_id) WHERE object_id IS NOT NULL;"
].join('\n')

SubscriberTag.belongsTo(Media, {foreignKey: 'media_id'})

SubscriberTag.getter.name = function() {
  return this._name || this.uid
}

SubscriberTag.TYPES = TYPES

SubscriberTag.registerType = function(name, value, model) {
  name = name.toUpperCase()
  if (name in TYPES) {
    throw new Error('Tag type conflict: ' + name)
  }
  if (TYPES.byId(value)) {
    throw new Error('Tag type value existed: ' + name + ' -> ' + value)
  }
  TYPES.add(name, { id: value, model: model })
}

SubscriberTag.upsert = SubscriberTag.upsertBy('media_id', 'name')
SubscriberTag.upsertByObjectId = SubscriberTag.upsertBy('type', 'object_id')

SubscriberTag.getByObjectId = function(type, object_id) {
  return SubscriberTag.getOne({ type: type, object_id: object_id })
}

/**
 * Create a tag based on related object's type & id
 * @param {Model} obj, must be an instance
 */
SubscriberTag.upsertByObject = function(obj) {
  // find the type
  var type = _.find(TYPES.all(), function(item) {
    return item.value && item.value.model === obj.constructor
  })
  if (!type) {
    throw new Error('Don\'t know how to upsert a "' +  obj.constructor.modelName + '" tag')
  }
  if (!obj.id) {
    throw new Error('Object does not exist yet, save it first')
  }
  if (!obj.media_id) {
    throw new Error('Object must have a media_id')
  }
  name = obj.name || (type.name + ' ' + (obj.uid || obj.id))
  data = { name: name, media_id: obj.media_id }
  return SubscriberTag.upsertByObjectId(type.id, obj.id, data)
}


/**
 * Get relative object by type
 */
SubscriberTag.prototype.relatedObject = function() {
  var type = TYPES.byId(this._type)
  var Model = type && type.model
  var id = this.uid
  if (id && Model) {
    // uid == 'channel-xx'
    id = id.replace(type.name + '-', '')
    return Model.get(id)
  }
}

module.exports = SubscriberTag

var Subscriber = require('./index')
var TagIndex = db.define('subscriber_tag_index')

// Define subscriber.tags index
// One can use `subscriber.tags.create(xxx)` to create a tag for this user
Subscriber.hasAndBelongsToMany(SubscriberTag, {as: 'tags', through: TagIndex})


/**
 * Fetch all tags for user
 */
Subscriber.fetcher.tags = function(query) {
  var self = this
  return function(next) {
    self.tags(query || {}, next)
  }
}
