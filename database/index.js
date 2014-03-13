var db = require('../lib/db')
var thunkify = require('thunkify')
var debug = require('debug')('curio:db_schema')

var models = [
  require('../models/user'),
  require('../models/user/passport'),
  require('../models/media'),
  require('../models/media/admin'),
  require('../models/message'),
  require('../models/subscriber'),
]

db.automigrate = thunkify(db.automigrate)

exports.init = function *() {
  yield db.automigrate()
  // add more constrains on the database
  for (var i = 0, l = models.length; i < l; i++) {
    m = models[i]
    if (m.SCHEMA_SQL) {
      debug('Applying schema sql for %s...', m.modelName)
      var result = yield db.adapter.execute(m.SCHEMA_SQL)
    }
  }
}
