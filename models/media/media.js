var db = require_('lib/db')

var Media = db.model({
  tableName: 'media',
  hasTimestamps: true,
  admins: function() {
    return this.belongsToMany(db.models.media_admin)
  }
})

module.exports = Media
