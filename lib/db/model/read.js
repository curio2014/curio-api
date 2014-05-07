"use strict";
var __slice = [].slice
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')

var pg = require('pg')
var PG_DUPLICATE = '23505'

var Model = require('./index')

/**
 * findOne with simpler query arguments (no sort support)
 */
Model.getOne = function getOne(query) {
  if ('object' == typeof query) {
    if (Object.keys(query).length == 1 && 'id' in query) {
      return this.get(query.id)
    }
  }
  return this.findOne({ where: query })
}

/**
 * Get by id(number) or uid(string)
 */
Model.get = function* get(id) {
  if (id === null || id === undefined) {
    throw new Error('Model.get id cannot be null')
  }
  // empty id is empty (including zero)
  if (!id) {
    return null
  }
  if (_.isdigit(id)) {
    return yield this.find(id)
  }
  if (!this.hasColumn('uid')) {
    return null
  }
  return yield this.findOne({where: {uid: id}})
}

/**
 * Get by ids
 */
Model.gets = function getAll(ids) {
  return this.all({ where: { id: { inq: ids } } })
}

/**
 * Searchable fields, and their default ordering
 *
 * Example:
 *
 *    Model.scolumns = {
 *      create_at: 'DESC'
 *    }
 */
Model.scolumns = {}

Model.defaultLimit = 20
Model.defaultOrder = null
Model.queryFormatter = {
  // jugglingdb use `skip`, we use offset
  offset: function(q) {
    return Number(q.offset)
  },
  limit: function(q) {
    return Number(q.limit)
  },
  order: function(q) {
    // in case of `?order=abc%20asc&order=foo%20desc` (when order is Array)
    var order = q.order && q.order.toString().split(',').join(' ')
    return order || this.defaultOrder
  },
  where: function(q, opts) {
    // only the searchable columns
    var fields = this.scolumns

    var k, order, where
    for (k in fields) {
      // the default order is setted in scolumns
      order = fields[k]
      if (k in q) {
        // column setted in this query
        where = where || {}
        // update where statement with real database value
        where[k] = this.safeValue(k, q[k])
      }
      // when query opts don't have a order
      // give the opts a default order
      if (order && !opts.order) {
        // only 'DESC' or 'ASC' is allowed
        if (order !== 'ASC') {
          order = 'DESC'
        }
        opts.order = k + ' ' + order
      }
    }
    return where
  }
}


/**
 * Convert query filter to SQL
 */
Model.filterToSQL = function(options) {
  return sql.select(this.tableName)(options)
}


/**
 * Format database safe query string from url parameters
 */
Model.safeQuery = function safeQuery(query) {
  if (!query) return
  var opts = {}
  var k, r, fomatter = this.queryFormatter
  if (typeof fomatter == 'function') {
    return fomatter(query, opts)
  }
  for (k in fomatter) {
    r = fomatter[k].call(this, query, opts)
    // null, 0, '' are allowed
    if (r === undefined || (isNaN(r) && 'number' == typeof r)) {
      continue
    }
    opts[k] = r
  }
  if (opts.limit === undefined) {
    // give a default query limit
    opts.limit = Model.defaultLimit
  }
  if (!opts.where) {
    // when no where condition, add a default order
    // default sort order is ID desc
    opts.order = opts.order || 'id desc'
  }
  return opts
}

/**
 * Get real database value from setter
 */
Model.safeValue = function safeValue(k, value) {
  if (this.setter[k]) {
    var obj = {}
    this.setter[k].call(obj, value)
    return obj[k] || obj['_' + k]
  }
  return value
}


/**
 * Create a finder for one or more property
 *
 * Examples:
 *
 *    Model.findByUser = Model.findBy('user_id')
 *    Model.getByAandB = Model.findBy('a', 'b', onlyOne=true)
 */
Model.findBy = function() {
  var props = __slice.call(arguments)
  var onlyOne = false
  if ('string' != typeof props[props.length-1]) {
    onlyOne = props.pop()
  }
  var len = props.length

  var methodName = onlyOne ? 'findOne': 'all'

  return function findByProp() {
    var args, options
    args = __slice.call(arguments)
    if (args.length < len) {
      throw new Error('All arguments are required: ' + props.join(', '))
    }
    if ('object' == typeof args[args.length-1]) {
      options = args.pop()
    }
    options = options || {}
    options.where = options.where || {}
    props.forEach(function(item, i) {
      var val = args[i]
      if (val === undefined) {
        val = null
      }
      options.where[item] = val
    })
    return this[methodName](options)
  }
}


