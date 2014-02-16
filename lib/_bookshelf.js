/**
 * This file is OBSOLETE.
 */

var conf = require_('conf')
var debug = require('debug')('curio:db')
var error = require('debug')('curio:db:error')
var Bookshelf = require('bookshelf')

var db = Bookshelf.initialize({
  client: 'postgres',
  debug: conf.debug,
  connection: conf.postgres
})

db.plugin('virtuals')
db.plugin('visibility')


var Model = db.Model

db.models = {};
db.collections = {};

db.model = function(config) {
  if (typeof config === 'string') {
    return db.models[config]
  }
  var name = config.tableName
  var model =  Model.extend(config)
  db.models[name] = model
  db.collections[name] = model.Collection = db.Collection.extend({
    model: model
  })
  return model
}

// export for quick usages
db.proto = Model.prototype


Model.prototype.update = function *(attrs, value) {
  if ('object' != typeof attrs) {
    var name = attrs
    attrs = {}
    attrs[name] = value
  }
  // handle virtuals
  for (var k in attrs) {
    if (k in this.virtuals) {
      var setter = this.virtuals[k].set;
      if (setter) {
        this.set(k, attrs[k])
      } else {
        error('trying to update a virtual attribue: ' + k + ', ' + attrs[k])
        delete attrs[k] // just skip
      }
    }
  }
  var result = yield this.save(attrs, { patch: true })
  return result
}

Model.find = function(query, options) {
  var coll = this.Collection.forge([])
  if (query) {
    coll = coll.query({ where: query })
  }
  if (options) {
    coll = coll.query(options)
  }
  return coll.fetch()
}

Model.count = function(query) {
  var qb = db.knex(this.prototype.tableName)
  if (query) {
    qb = qb.where(query)
  }
  return qb.count(this.prototype.idAttribute)
}

Model.findOne = function(query, options) {
  var model = this.forge(query)
  if (options) {
    model = model.query(options)
  }
  return model.query({ limit: 1 }).fetch()
}

Model.fromId = function(id) {
  var attr = {}
  if (isdigit(id)) {
    attr[this.prototype.idAttribute] = id
  } else {
    attr.uid = id
  }
  return this.forge(attr)
}

Model.get = function(id) {
  var cls = this
  return cls.fromId(id).fetch()
}

// Must call `.save` to really create
Model.getOrCreate = function *(id) {
  var cls = this
  return (yield cls.get(id)) || cls.fromId(id)
}

Model.upsert = function *(id, attrs) {
  var model = yield this.getOrCreate(id)
  var result = yield model.save(attrs, { patch: true })
  return result
}


function isdigit(text) {
  return !isNaN(Number(text))
}

module.exports = db;
