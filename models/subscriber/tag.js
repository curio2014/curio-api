var db = require_('lib/db')
var Named = require_('lib/named')

var TYPES = Named({
  NORM: 0,
})

var SubscriberTag = db.define('subscriber_tag', {
  created_at: Date,
  updated_at: Date,
  name: { type: String },
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

module.exports = SubscriberTag

// Never access this alone
var TagIndex = db.define('subscriber_tag_index')

var Subscriber = require('./index')

Subscriber.hasAndBelongsToMany(SubscriberTag, {as: 'tags', through: TagIndex})
