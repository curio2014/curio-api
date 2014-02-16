/**
 * wrap RESTful resource defination with proper methods
 */
var method_alias = {
  'index': 'get',
  'read': 'get',
  'create': 'post',
  'update': 'put',
  'destroy': 'delete'
}

module.exports = function(app) {
  return function(rule, resource) {
    var route = app.route(rule)
    var method, handler, alias
    // attach resource functions to route
    for (method in resource) {
      if (method in method_alias) {
        route[method_alias[method]](resource[method])
      }
      if (method in route) {
        route[method](resource[method])
      }
    }
    return resource
  }
}
