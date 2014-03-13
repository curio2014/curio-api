var method_alias = {
  'index': 'get',
  'read': 'get',
  'create': 'post',
  'update': 'put',
  'destroy': 'delete'
}


/**
 * wrap RESTful resource defination with proper methods
 */
module.exports = function rest(rule, resource) {
  // A trie-router rule
  var route = this.route(rule)
  var method, handler, alias
  // attach resource functions to route
  (resource.methods || Object.keys(resource)).forEach(function(method) {
    if (method in method_alias) {
      route[method_alias[method]](resource[method])
    }
    if (method in route) {
      route[method](resource[method])
    }
  })
  return resource
}

