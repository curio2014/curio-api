"use strict";

/**
 * Hack into PG client
 */
var thunkify = require('thunkify')

var db = require('./index')

// A yieldable query function
db.adapter.execute = thunkify(db.adapter.query)


