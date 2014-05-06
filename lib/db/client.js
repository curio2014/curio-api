"use strict";

/**
 * Hack into PG client
 */
var thunkify = require('thunkify')

var db = require('./index')

// A yieldable query function
db.adapter.execute = thunkify(db.adapter.query)

/**
 * Execute raw SQL using adapter
 */
db.run = function* (sql) {
  return yield this.adapter.execute(sql)
}

