/**
 * To serve a backbone compatible RESTful API
 */
var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS


function defaultHandler(method, model) {
  if (method == 'index') {
    return function *list() {
      var query = model.safeQuery(_.assign(this.query, this.params))
      var total = yield model.count(query.where)
      var runner = model.all(query)
      var includes = this.query.include
      if (includes) {
        if (!Array.isArray(includes)) {
          includes = includes.split(',')
        }
        includes = includes.filter(function(item) {
          return model.canAttach(item)
        })
        runner = runner.attach(includes)
      }
      var items = yield runner
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
    return function *create() {
      var item = new model(_.assign(this.req.body, this.params))
      var valid = yield item.validate()
      assert(valid, 400, 'bad fields', item.errors)
      yield item.save()
      this.body = item
    }
  } else if (method == 'read') {
    return function *read() {
      var item = this.item || (yield model.getOne(this.params))
      assert(item, 404)
      var ret = {}
      this.body = item
    }
  } else if (method == 'destroy') {
    return function *destroy() {
      var item = this.item || (yield model.getOne(this.params))
      if (item) {
        yield item.destroy()
      }
      this.status = 202
      this.body = {
        ok: true
      }
    }
  } else if (method == 'update') {
    return function *update() {
      var item = this.item || (yield model.getOne(this.params))
      assert(item, 404)
      try {
        yield item.updateAttributes(this.req.body)
      } catch (e) {
        assert(!item.errors, 400, 'bad fields', item.errors)
        throw e
      }
      this.body = item
    }
  }
}


function Resource(model, handlers, befores) {
  if (!(this instanceof Resource)) {
    return new Resource(model, handlers)
  }
  // first argument is not a constructor, then it is handlers
  if (typeof model == 'object') {
    handlers = model
  }
  handlers = handlers || ['read', 'update', 'destroy']
  if (Array.isArray(handlers)) {
    handlers = _.zipObject(handlers)
    for (var k in handlers) {
      handlers[k] = defaultHandler(k, model)
    }
  }
  this.handlers = handlers
  this.befores = befores || {}

  this.init()
}


Resource.prototype.init = function(handlers) {
  var resource = this
  var befores = resource.befores
  var handlers = resource.handlers

  var methods = this.methods = Object.keys(handlers)
  var handlers = this.handlers = handlers || {}

  methods.forEach(function(method, i) {
    befores[method] = []
    resource[method] = function *(next) {
      var access = befores[method]
      var handler = resource.handlers[method]
      if (access.length) {
        for (var i = 0, l = access.length; i < l; i++) {
          // access function returned error, stop
          if (yield access[i]) {
            return
          }
        }
      }
      yield handler
      yield _.sleep(.5) // slow request debug
      if (next) yield next
    }
  })
}

/**
 * Add access control handlers
 *
 * @param {String|Array} method
 * @param {Function} middleware
 */
Resource.prototype.use = function(method, middleware, isAfter) {
  if ('function' == typeof method) {
    isAfter = middleware
    middleware = method
    method = 'all'
  }
  var list = [method]
  //var middlewares = isAfter ? afters : befores
  var middlewares = this.befores
  if (method === 'all') {
    list = this.methods
  } else if (method === 'write') {
    // only wirte methods
    list = _.intersection(this.methods, ['create', 'update', 'destroy'])
  }
  list.forEach(function(method) {
    middlewares[method].push(middleware)
  })
  return this
}

/**
 * Fork a new resource with the same middlewares and handlers
 */
Resource.prototype.fork = function(handlers) {
  return new Resource(this.model, _.assign({}, this.handlers, handlers), this.befores)
}

/**
 * Spawn a new resource requires the parent resource
 */
Resource.prototype.spawn = function(subResouce) {
  var model = this.model
  var befores = subResouce.befores

  function *getItem() {
    this[model.modelName] = yield model.getOne(this.params)
  }
  // befores is indexed by http method
  for (var k in this.befores) {
    befores[k] = this.befores[k].concat(getItem)
  }
  return subResouce
}


module.exports = Resource
