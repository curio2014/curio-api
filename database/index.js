var db = require('../lib/db')
var debug = require('debug')('curio:db_schema')
var knex = db.knex

function dropTableIfExists(tableName) {
  return knex.schema.dropTableIfExists(tableName)
}

function *dropAll() {
  yield dropTableIfExists('message')
  yield dropTableIfExists('media_admin')
  yield dropTableIfExists('subscriber')
  yield dropTableIfExists('media')
  yield dropTableIfExists('passport')
  yield dropTableIfExists('user')
}

exports.init = function* () {
  debug('dropping all databases...')
  yield dropAll
  debug('creatting databases...')
  yield require('./schema')
}
