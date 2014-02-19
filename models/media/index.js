var cached = require_('lib/cached')
var db = require_('lib/db')
var crc32 = require_('lib/utils').crc32

var Media = db.define('media', {
  created_at: Date,
  updated_at: Date,
  uid: { type: String, null: false, unique: true },
  oid: { type: String, null: false, unique: true },
  name: String,
  desc: String,
  wx_token: String,
  wx_appkey: String,
  wx_secret: String,
}, {
})

// wx_token will always has a value
Media.getter.wx_token = function() {
  return this._wx_token || 'keyboardcat123'
}

cached.register(Media)
Media.enableCache('get_', '{_model_}:{0}')
Media.itemCacheKeys.push('{_model_}:{uid}')

module.exports = Media


//Media.prototype.

// load mixins
require('./admin')
require('./webot')
