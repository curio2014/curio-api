"use strict";

var Model = module.exports = require('./model')

// postgres escape
Model.esc = require('pg-escape')

require('./read')
require('./write')
require('./hook')
require('./timeseries')

// =========== Global Hooks ===========

/**
 * Timestamp support
 */
Model.hook('beforeCreate', function(next) {
  var self = this
  // Timestamp hooks
  if (this.hasColumn('created_at') && !this.created_at) {
    this.created_at = new Date();
  }
  next()
})

Model.hook('beforeSave', function* () {
  var self = this
  if (this.hasColumn('updated_at')) {
    this.updated_at = new Date();
  }
})

Model.hook('afterSave', function* () {
  yield this._clearCache
  // dump all remote attributes
  yield this.dump()
})
Model.hook('afterDestroy', function(next) {
  this._clearCache(next)
})


