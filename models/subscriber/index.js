var db = require_('lib/db')
/**
 * Subscriber of a cirtain wechat media account
 */
var Subscriber = db.define('subscriber', {
  created_at: Date,
  updated_at: Date,
  phone: String,
  name: String,
  desc: String,
}, {
})

// source media account
Subscriber.belongsTo('media', {foreignKey: 'media_id'})
