var db = require_('lib/db')
var Named = require_('lib/named')

var TYPES = Named({
  NORM: 0,
})

var SubscriberTag = db.define('subscriber_tag', {
  created_at: Date,
  updated_at: Date,
  name: { type: String, unique: true },
  // tag name in the URL
  uid: { type: String, null: false },
  type: TYPES,
})

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

/**
 * Create a tag based on related object's type & id
 */
SubscriberTag.upsertByObject = function(obj) {
  // find the type
  var type = _.first(TYPES, function(item) {
    return item.model === obj.constructor
  })
  if (!type) {
    throw new Error('Don\'t know how to upsert a "' +  obj.constructor.modelName + '" tag')
  }
  var uid = type.name + '-' + obj.id
  return SubscriberTag.upsert(uid, { name: obj.name })
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
Subscriber.fetcher.tags = function* () {
  return yield this.tags.all()
}
