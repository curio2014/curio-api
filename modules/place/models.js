var db = require_('lib/db')

var Place = db.define('place', {
  created_at: Date,
  lat: Number,
  lng: Number,
  name: String,
})


Place.nearby = function(lat, lng) {
  db.adapter.execute(sql)
}
