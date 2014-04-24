var db = require('../lib/db')
var thunkify = require('thunkify')
var debug = require('debug')('curio:db_schema')

db.automigrate = thunkify(db.automigrate)



exports.init = function *() {
  // Require the application, to trigger module load
  require('../app')

  yield db.automigrate()

  // add more constrains on the database
  for (var k in db.models) {
    var m = db.models[k]
    if (m.SCHEMA_SQL) {
      debug('Applying schema sql for %s...', m.modelName)
      yield db.adapter.execute(m.SCHEMA_SQL)
    }
  }
}
