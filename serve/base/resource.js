/**
 * To serve a backbone compatible RESTful API
 */
var _ = require_('lib/utils')
var assert = require_('serve/utils').assert
var ERRORS = require_('serve/consts').ERRORS


function sleep(i) {
  return function(next) {
    setTimeout(next, i * 1000)
  }
}

function defaultHandler(method, model, paramName) {
  if (method == 'index') {
    return function *list() {
      var total = yield model.count()
      var query = model.safeQuery(this.query)
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
      var item = yield model.get(this.params[paramName])
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
      var item = yield model.get(this.params[paramName])
      if (!item) {
        assert(item, 404)
      }
      try {
        yield item.updateAttributes(this.req.body)
      } catch (e) {
        assert(!item.errors, 400, 'bad fields', item.errors)
        throw e
      }
      this.body = {
        item: item
      }
    }
  }
}


function Resource(model, handlers, paramName) {
  paramName = paramName || 'id'

  // first argument is not a constructor, then it is handlers
  if (typeof model == 'object') {
    handlers = model
  }
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
      // only wirte methods
      list = _.intersection(methods, ['create', 'update', 'destroy'])
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
    if (!handler) {
      throw new Error('handler for "' + method + '" cannot be empty')
    }
    resource[method] = function *(next) {
      if (access.length) {
        for (var i = 0, l = access.length; i++; i < l) {
          // access function returned error, stop
          if (yield access[i]) {
            return
          }
        }
      }
      yield sleep(.2) // slow request debug
      yield handler
      if (next) yield next
    }
  })

  return resource
}


module.exports = Resource
