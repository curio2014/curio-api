var method_alias = {
  'index': 'get',
  'read': 'get',
  'create': 'post',
  'update': 'put',
  'destroy': 'delete'
}
var Resource = require('./resource')


/**
 * wrap RESTful resource defination with proper methods
 */
module.exports = function rest(rule, resource) {
  // A trie-router rule
  var route = this.route(rule)

  if (!resource) {
    // create a new Resource if not exist
    resource = Resource()
  }

  // Apply middlewares later,
  // so we can write like:
  //
  //   app.rest('/path/to/resource')
  //     .update(...)
  //     .read(...)
  //
  process.nextTick(function() {
    var method, handler, alias

    middlewares = resource.middlewares || resource

    // attach middlewares functions to route
    Object.keys(middlewares).forEach(function(method) {
      if (method in method_alias) {
        route[method_alias[method]](middlewares[method])
      }
      if (method in route) {
        route[method](middlewares[method])
      }
    })
  })

  return resource
}

