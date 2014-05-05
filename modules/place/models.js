"use strict";

var db = require_('lib/db')

var Place = db.define('place', {
  created_at: Date,
  updated_at: Date,
  lat: { type: Number, allowNull: false },
  lng: { type: Number, allowNull: false },
  name: String,
})


Place.registerProps({
  introduction: null
})


Place.nearby = function(lat, lng) {
  db.adapter.execute(sql)
}
