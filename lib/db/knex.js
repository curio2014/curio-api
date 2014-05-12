"use strict";

var Knex = require('knex')

module.exports = Knex.initialize({
  client: 'postgres',
  connection: require_('conf').postgres
})

