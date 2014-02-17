var db = require_('lib/db')
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


Subscriber.upsertByOpenId = function *(oid, data) {
  var item = yield this.findOne({ where: { oid: oid } })
  if (item) {
    for (var k in data) {
      if (data[k] != item[k]) {
        return yield item.updateAttributes(data)
      }
    }
    return item
  } else {
    data = data || {}
    data.oid = oid
    return yield this.create(data)
  }
}


module.exports = Subscriber
