"use strict";
/**
 * To serve a backbone compatible RESTful API
 */
var _ = require_('lib/utils')
var __push = Array.prototype.push
var assert = require_('serve/base/utils').assert
var ERRORS = require_('models/errors')
var compose = require('koa-compose')


/**
 * Get a runner with all async data attached
 */
function getRunner(runner, includes) {
  if (!includes) {
    return runner
  }
  if (!Array.isArray(includes)) {
    includes = includes.split(',')
  }
  includes = includes.filter(function(item) {
    return runner.model.canAttach(item)
  })
  return runner.attach(includes)
}


function defaultHandler(method, Model) {
  if (method == 'index') {
    return function* list() {
      var query = Model.safeQuery(_.assign(this.query, this.params))
      var total = yield Model.count(query.where)
      var items = yield getRunner(Model.all(query), this.query.include)
      var offset = query.offset || 0
      var limit = query.limit || 20
      //yield items[0].updateAttributes({ wx_secret: 'abaf' })
      this.body = {
        offset: offset,
        limit: limit,
        total: total,
        items: items
      }
    }
  } else if (method == 'create') {
    return function* create() {
      var data = this.req.body
      var list = Array.isArray(data) ? data : [data]
      var result, error

      var i, item, valid
      for (i in list) {
        item = new Model(list[i])
        valid = yield item.validate()
        if (!valid) {
          error = item.errors
          // pass item index on
          error.index = i
        }
        // will break on first error
        assert(valid, 400, ERRORS.BAD_REQUEST, error)
      }
      result = this.item = yield Model.create(data)
      this.body = result
    }
  } else if (method == 'read') {
    return function* read() {
      if (this.params.id === '') {
        // empty ID string, remove trailing slash
        return this.redirect(this.url.replace(/\/$/, ''))
      }
      var item = this.item
      if (!item) {
        item = this.item = yield getRunner(Model.getOne(this.params), this.query.include)
      }
      assert(item, 404)
      this.body = item
    }
  } else if (method == 'destroy') {
    return function* destroy() {
      var item = this.item || (yield Model.getOne(this.params))
      assert(item, 404)
      yield item.destroy()
      this.status = 202
      this.body = {
        ok: true
      }
    }
  } else if (method == 'update') {
    return function* update() {
      var item = this.item || (this.item = yield Model.getOne(this.params))
      assert(item, 404)
      try {
        yield item.updateAttributes(this.req.body)
      } catch (e) {
        assert(!item.errors, 400, ERRORS.BAD_REQUEST, item.errors)
        throw e
      }
      this.body = item
    }
  }
}


/**
 *
 * Resource for RESTful API,
 * can be used for build default handlers for a Model,
 * or just create a simple resource Object for adding
 * access control and handlers easily.
 *
 * Examples:
 *
 *    Resource(Book)
 *    Resource(Book, ['index', 'create'])
 *    Resource({
 *      index: function* () {},
 *      ...
 *    })
 *
 * @param {function}      model, a constructor function
 * @param {Object|Array}  handlers
 */
function Resource(model, handlers) {
  if (!(this instanceof Resource)) {
    return new Resource(model, handlers)
  }

  // The handlers attach by `resource.read|update|destroy..` API
  this.handlers = {}
  // Access control middlewares added by `resource.use(method, *fn)` api
  this.befores = {}

  if (handlers && 'function' != typeof model) {
    throw new Error('Model must be a constructor function')
  }
  // first argument is not a constructor function, then it is handlers
  if (typeof model == 'object') {
    handlers = model
  }
  if (model || handlers) {
    handlers = handlers || ['read', 'update', 'destroy']
    // convert methods array to model's default handler
    if (Array.isArray(handlers)) {
      handlers = _.zipObject(handlers)
      for (var k in handlers) {
        handlers[k] = model ? [defaultHandler(k, model)] : []
      }
    }
    // apply handler middlewares
    this._set(handlers)
  }
}


/**
 * get middleware for given method
 *
 * @return {Array} the middlewares array
 */
Resource.prototype._mw = function(category, method) {
  if (!this[category][method]) {
    // once defined, middleware arrays are not changeable
    // so we can push functions into the array later,
    // even after it is `composed`
    Object.defineProperty(this[category], method, {
      enumerable: true,
      value: []
    })
  }
  return this[category][method]
}

/**
 * Available method list based on methods added to handlers
 */
Resource.prototype.methods = function() {
  return Object.keys(this.handlers)
}

/**
 * Set handlers per method
 *
 * @param {Object} handlers, a (method->function) mapping
 */
Resource.prototype._set = function(handlers) {
  var self = this
  Object.keys(handlers).forEach(function(method) {
    var fns = handlers[method]
    if (!Array.isArray(fns)) {
      fns = [fns]
    }
    self.handlers[method] = fns
  })
}

var HTTP_ALIAS = {
  'index': 'list',
  'read': 'get',
  'update': 'post',
  'destroy': 'delete',
  'create': 'put',
}

// Add http & alias methods for resource instance
Object.keys(HTTP_ALIAS).forEach(function(method) {
  var http_method = HTTP_ALIAS[method]
  Resource.prototype[method] =
  Resource.prototype[http_method] = function() {
    var mw = this._mw('handlers', method)
    // append middlewares in arguments
    __push.apply(mw, arguments)
    return this
  }
})

/**
 * Add access control
 *
 * @param {String|Array} method
 * @param {Function} middleware
 */
Resource.prototype.use = function(methods, middleware) {
  if ('function' == typeof methods) {
    middleware = methods
    methods = 'all'
  }
  if (methods === 'all') {
    methods = ['create', 'update', 'destroy', 'read', 'index']
  } else if (methods === 'write') {
    methods = ['create', 'update', 'destroy']
  } else if (methods === 'read') {
    methods = ['read', 'index']
  } else if (!Array.isArray(methods)) {
    methods = [methods]
  }
  var self = this
  methods.forEach(function(method) {
    var access = self._mw('befores', method)
    access.push(middleware)
    if (!access._stacked) {
      // prepend access controllers to the real middleware list
      self._mw('handlers', method).unshift(compose(access))
      access._stacked = true
    }
  })
  return self
}

function* idOverride() {
  var id = this.params.related_id
  this.params = {
    media_id: this.params.id
  }
  if (id) {
    this.params.id = id
  }
}
module.exports = Resource
