/**
 * To serve a backbone compatible RESTful API
 */

function has(arr, item) {
  return arr.indexOf(item) !== -1
}

function defaultHandler(method, model, paramName) {
  if (method == 'index') {
    return function *list() {
      var total = yield model.count()
      var items = yield model.find()
      this.body = {
        total: total,
        items: items
      }
    }
  }
  if (method == 'read') {
    return function *read() {
      var item = yield model.get(this.params[paramName])
      if (!item) this.throw(404)
      var ret = {}
      ret[paramName] = item
      this.body = ret
    }
  }
}


function Resource(model, handlers, paramName) {

  paramName = paramName || model.prototype.tableName

  var methods = handlers ? Object.keys(handlers) : ['index', 'create', 'read', 'update', 'destroy']
  var middlewares = {}

  var resource = {
    Model: model,
    use: function(method, middleware) {
      if (!middleware) {
        middleware = method
        method = 'all'
      }
      var list = [method]
      if (method == 'all') {
        list = methods
      } else if (method == 'write') {
        list = ['create', 'update', 'destroy']
      }
      list.forEach(function(method) {
        middlewares[method].push(middleware)
      })
      return this
    }
  }

  methods.forEach(function(method, i) {
    var access = middlewares[method] = []
    var handler = handlers && handlers[method] || defaultHandler(method, model, paramName)
    resource[method] = function *(next) {
      if (access.length) {
        yield access
      }
      yield handler
      yield next
    }
  })

  return resource
}


module.exports = Resource
