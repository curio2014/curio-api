var db = require_('lib/db')

var SubscriberTag = db.define('subscriber_tag', {
}, {
})

SubscriberTag.belongsTo('subscriber', {foreignKey: 'subscriber_id'})
