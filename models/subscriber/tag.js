var db = require_('lib/db')
var Named = require_('lib/named')

var TYPES = Named({
  NORM: 0,
})

var SubscriberTag = db.define('subscriber_tag', {
  created_at: Date,
  updated_at: Date,
  name: { type: String, unique: true },
  uid: { type: String, null: false },
})

TYPES.bind(SubscriberTag, 'type')

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
 * Create a tag based on related object value
 */
SubscriberTag.upsertByObject = function(obj) {
  var type, uid
  TYPES.forEach(function(item) {
    if (item.model === obj.constructor) {
      type = item
      return false
    }
  })
  if (!type) {
    throw new Error('Don\'t know how to upsert a "' +  obj.constructor.modelName + '" tag')
  }
  uid = type.name + '-' + obj.id
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

// Never access this alone
var TagIndex = db.define('subscriber_tag_index')

var Subscriber = require('./index')

// Define subscriber.tags index
// One can use `subscriber.tags.create(xxx)` to create a tag for this user
Subscriber.hasAndBelongsToMany(SubscriberTag, {as: 'tags', through: TagIndex})
