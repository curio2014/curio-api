//var debug = require_('lib/utils/logger').debug('subscriber')
var db = require_('lib/db')
var cached = require_('lib/cached')
var Media = require_('models/media')

/**
 * Subscriber of a cirtain wechat media account
 */
var Subscriber = db.define('subscriber', {
  created_at: Date,
  updated_at: Date,
  subscribe: { type: Boolean, null: false, default: true }, // subscription status
  credit: { type: Number, null: false, default: 0 }, // user activity credit
  oid: { type: String, null: false },
  phone: String,
  name: String,
}, {
})

module.exports = Subscriber

// source media account
Subscriber.belongsTo(Media, {as: 'media', foreignKey: 'media_id'})

// searchable columns, then API can use ?media_id=xxx
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

//Subscriber.get = Subscriber.finder('oid', 'media_id', true)
Subscriber.upsert = Subscriber.upsertBy('oid', 'media_id')
Subscriber.findByOpenId = Subscriber.finder('oid')
Subscriber.findByMedia = Subscriber.finder('media_id')


Subscriber.getter.key = function() {
  return this.oid + ':' + this.media_id
}


cached.register(Subscriber)

// cache by openId + media_id
Subscriber.enableCache('findOne_', '{_model_}:{0.where.oid}:{0.where.media_id}')
Subscriber.addCacheKey('{_model_}:{this.oid}:{this.media_id}')



// detail properties from wechat API
require('./detail')
