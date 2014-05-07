"use strict";
//
//  @TODO: this file is not in use yet
//
/**
 * Postgres options to SQL
 */
var knex = require('knex')
var esc = require('pg-escape')

exports.select = function(table, columns) {
  columns = columns ? esc.indent(columns) : '*'
  return function(options) {
    var query = esc('SELECT %s FROM %I', columns, table)
    var filter = options.where
    var order = options.order
    if (filter) {
      if ('string' === typeof filter) {
        query += esc(' WHERE %s', filter)
      } else {
        var k, val
        for (k in filter) {
          if (filter.hasOwnProperty(k)) {
            val = filter[k]
          }
        }
      }
    }
    if (order) {
      query += esc(' ORDER BY %s', order)
    }
    if (options.limit) {
      query += esc(' LIMIT %s OFFSET %s', options.limit, options.offset || 0)
    }
    return query
  }
}
