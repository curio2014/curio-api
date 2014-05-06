"use strict";

var Media = require_('models/media')
var db = require_('lib/db')

var Place = db.define('place', {
  created_at: Date,
  updated_at: Date,
  media_id: { type: Number, null: false },
  lat: { type: Number, default: 0, dataType: 'float' },
  lng: { type: Number, default: 0, dataType: 'float' },
  phone: { type: String },
  name: String,
})
Place.belongsTo(Media, {foreignKey: 'media_id'})

Place.registerProps({
  intro: null
})


/**
 * Search for nearby places
 */
Place.nearby = function(lat, lng) {
  var sql = ''
  db.adapter.execute(sql)
}

module.exports = Place
