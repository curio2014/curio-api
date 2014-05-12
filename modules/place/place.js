"use strict";

var _ = require_('lib/utils')
var Media = require_('models/media')
var db = require_('lib/db')
var conf = require_('conf')

var Place = db.define('place', {
  created_at: Date,
  updated_at: Date,
  media_id: { type: Number, null: false },
  lat: { type: Number, default: 0, dataType: 'double' },
  lng: { type: Number, default: 0, dataType: 'double' },
  phone: { type: String },
  address: { type: String },
  name: { type: String },
}, {
})

Place.SCHEMA_SQL = [
'CREATE INDEX place_geo_index ON place USING gist(ll_to_earth(lat, lng));'
].join('\n')

Place.validateAsync('lat', function(error, done) {
  var lat = this.lag, lng = this.lng
  if (lat && lng || (!lat && !lng)) {
  } else {
    error()
  }
  done()
}, { message: 'none or both' })

Place.belongsTo(Media, {foreignKey: 'media_id'})

/**
 * Extra props for display compaign pages
 */
Place.registerProps({
  intro: null
})


/**
 * Search for nearby places
 */
Place.nearby = function* (lat, lng, options) {
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('lat && lng must be numbers')
  }

  options = options || {}

  _.defaults(options, {
    meters: 5000,
  })

  var media_id = options.media_id
  var meters = options.meters

  if (media_id && isNaN(media_id)) {
    throw new Error('Invalid media_id')
  }

  var cond = 'earthbox(ll_to_earth(%s, %s), %s) @> ll_to_earch(lat, lng)'
  if (media_id) {
    cond += ' AND media_id=' + media_id
  }
  cond += ' ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(%s, %s)) ASC'

  options.where = this.esc(cond, lat, lng, meters, lat, lng)

  return yield this.all(options)
}


/**
 * Coordinate as an Array
 */
Place.prototype.coordinate = function() {
  return this.lat && this.lng && [this.lat, this.lng]
}

/**
 * Url for display place
 */
Place.prototype.url = function() {
  return conf.pagesRoot + '/place/' + this.id
}

module.exports = Place
