//var debug = require_('lib/utils/logger').debug('subscriber')
var db = require_('lib/db')
var leveldb = require_('lib/leveldb')
var sub = leveldb.sublevel('subscriber_oid2id')

var DEFAULT_AVATAR_URL = '/images/user_default.jpg'

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
  headimgurl: DEFAULT_AVATAR_URL,
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
    try {
      id = yield sub.get(key)
      // give the id to current instance,
      this.id = id
    } catch (e) {
      if (!e.notFound) {
        throw e
      }
      // when sublevel get failed,
      // save operation will give this an id
      var stored = yield Subscriber.upsert(this.oid, this.media_id)
      this.id = stored.id
      yield sub.put(key, this.id)
    }
  }
  return id
}

Subscriber.prototype.key = function() {
  return this.oid + ':' + this.media_id
}


module.exports = Subscriber
