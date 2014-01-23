/**
 * To serve a backbone compatible RESTful API
 */
var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS

function defaultHandler(method, model, paramName) {
  if (method == 'index') {
    return function *list() {
      var total = yield model.count()
      var items = yield model.all()
      this.body = {
        total: total,
        items: items
      }
    }
  } else if (method == 'create') {
    return function *create() {
      var item = model.forge(this.body)
      var err = item.validate()
      assert(!err, 401, err)
      var ret = {}
      this.body = {
        item: item
      }
    }
  } else if (method == 'read') {
    return function *read() {
      if (!this.params[paramName]) {
        this.throw(404)
      }
      var item = yield model.get(this.params[paramName])
      if (!item) this.throw(404)
      var ret = {}
      this.body = {
        item: item
      }
    }
  } else if (method == 'destroy') {
    return function *destroy() {
      yield model.fromId(this.params[paramName]).destroy()
      this.body = {
        ok: true
      }
    }
  }
}


function Resource(model, handlers, paramName) {
  paramName = paramName || 'id'

  if (Array.isArray(handlers)) {
    handlers = _.zipObject(handlers)
  }

  var methods = handlers ? Object.keys(handlers) : ['read', 'update', 'destroy']
  var middlewares = {}

  var resource = {}

  /**
   * Add access control handlers
   *
   * @param {String|Array} method
   * @param {Function} middleware
   */
  resource.use = function(method, middleware) {
    if (!middleware) {
      middleware = method
      method = 'all'
    }
    var list = method
    if (method === 'all') {
      list = methods
    } else if (method === 'write') {
      list = ['create', 'update', 'destroy']
    } else if ('string' === typeof method) {
      list = [method]
    }
    list.forEach(function(method) {
      middlewares[method].push(middleware)
    })
    return this
  }

  methods.forEach(function(method, i) {
    var access = middlewares[method] = []
    var handler = handlers && handlers[method] || defaultHandler(method, model, paramName)
    resource[method] = function *(next) {
      if (access.length) {
        yield access
      }
      yield handler
      if (next) yield next
    }
  })

  return resource
}


module.exports = Resource
