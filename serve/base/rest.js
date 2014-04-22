var method_alias = {
  'index': 'get',
  'list': 'get',
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

    middlewares = resource.handlers || resource

    // attach middlewares functions to route
    Object.keys(middlewares).forEach(function(method) {
      var http_method = method_alias[method]
      // Trie-router must have this http method
      route[http_method](middlewares[method])
    })
  })

  return resource
}

