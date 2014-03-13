/**
 * Load module
 */
var PATH = require('path')


function loadModule(name) {
  var routes, hooks
  try {
    routes = require_(PATH.join('modules', name, 'routes'))
    hooks = require_(PATH.join('modules', name, 'hooks'))
  } catch (e) {
    console.log(e)
  }
}

/**
 * All enabled modules
 */
function loadAll() {
  var names = require_('modules').enabled
  names.forEach(function(item) {
  })
}

exports.load = loadModule
exports.all = loadAll
