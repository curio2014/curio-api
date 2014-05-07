"use strict";

var conf = require_('conf')
var _ = require_('lib/utils')
var Schema = require('jugglingdb').Schema
var schemaOptions = _.clone(conf.postgres)
var Named = require_('lib/named')

schemaOptions.log = conf.debug

var db = new Schema('postgres', schemaOptions)

db._define = db.define
db.define = function(name, columns) {
  // gather enum properties first,
  // based on Named() object
  var enums = {}
  _.each(columns, function(val, k) {
    if (val instanceof Named) {
      enums[k] = val
      delete columns[k]
    }
  })
  var ret = db._define.apply(this, arguments)
  // define How to get a related remote object
  // must return a yialdable object
  ret.putter = {}
  ret.mfetcher = {}
  ret.fetcher = {}

  for (var k in enums) {
    enums[k].bind(ret, k)
  }

  return ret
}

db.JSON = Schema.JSON

module.exports = db

require('./client')
require('./model')
require('./remote')
require('./cprops')



