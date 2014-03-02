//var debug = require_('lib/utils/logger').debug('subscriber')
var db = require_('lib/db')
var cached = require_('lib/cached').create('subscriber_oid2id')

/**
 * Subscriber of a cirtain wechat media account
 */
var Subscriber = db.define('subscriber', {
  created_at: Date,
  updated_at: Date,
  subscribe: { type: Boolean, null: false, default: true },
  credit: { type: Number, null: false, default: 0 }, // user activity credit
  oid: { type: String, null: false },
  phone: String,
  name: String,
}, {
})

Subscriber.scolumns = {
  media_id: null,
  subscribe: null
}

Subscriber.SCHEMA_SQL = [
"CREATE INDEX ON subscriber(media_id);",
"CREATE INDEX ON subscriber(updated_at DESC);",
"CREATE INDEX ON subscriber(credit DESC) WHERE subscribe IS TRUE;",
"CREATE UNIQUE INDEX ON subscriber(oid, media_id);"
].join('\n')

Subscriber.registerProps({
  sex: null,
  city: null,
  country: null,
  province: null,
  language: null,
  headimgurl: null,
  subscribe_time: null,
})

// source media account
Subscriber.belongsTo('media', {foreignKey: 'media_id'})

//Subscriber.get = Subscriber.finder('oid', 'media_id', true)
Subscriber.upsert = Subscriber.upsertBy('oid', 'media_id')
Subscriber.findByOpenId = Subscriber.finder('oid')
Subscriber.findByMedia = Subscriber.finder('media_id')

/**
 * Get database id from leveldb
 * identified by OpenId + media_id
 */
Subscriber.prototype.getId = function *() {
  var id = this.id
  if (!id) {
    var key = this.key()
    id = yield cached.get(key)
    if (id) {
      // give the id to current instance,
      this.id = id
    } else {
      // if id is not in cache, try getOrCreate this subscriber
      var stored = yield Subscriber.upsert(this.oid, this.media_id)
      id = this.id = stored.id
      yield cached.set(key, id)
    }
  }
  return id
}

Subscriber.prototype.key = function() {
  return this.oid + ':' + this.media_id
}


module.exports = Subscriber
