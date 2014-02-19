var debug = require_('lib/utils').debug('model')
var db = require_('lib/db')
var leveldb = require_('lib/leveldb')
var sub = leveldb.sublevel('subscriber_oid2id')

/**
 * Subscriber of a cirtain wechat media account
 */
var Subscriber = db.define('subscriber', {
  created_at: Date,
  updated_at: Date,
  oid: { type: String, null: false, unique: true },
  phone: String,
  name: String,
  desc: String,
}, {
})
// source media account
Subscriber.belongsTo('media', {foreignKey: 'media_id'})

Subscriber.get = Subscriber.finder('media_id', 'oid', true)
Subscriber.findByOpenId = Subscriber.finder('oid')
Subscriber.findByMedia = Subscriber.finder('media_id')
Subscriber.upsert = Subscriber.upsertBy('media_id', 'oid')

/**
 * Get database id from leveldb
 * identified by OpenId + media_id
 */
Subscriber.prototype.getId = function *() {
  var id = this.id
  if (!id) {
    var key = this.key()
    try {
      id = yield sub.get_(key)
      // give the id to current instance,
      this.id = id
    } catch (e) {
      if (!e.notFound) {
        throw e
      }
      // when sublevel get failed,
      // save operation will give this an id
      yield this.save()
      yield sub.put_(key, this.id)
    }
  }
  return id
}

Subscriber.prototype.key = function() {
  return this.media_id + this.oid
}


module.exports = Subscriber
