/**
 * Modulized initialization
 */
var debug = require_('lib/utils/logger').debug('module')
var PATH = require('path')
var fs = require('fs')

var MODULES_ROOT = 'modules'

function loadModule(name) {
  var routes, hooks
  try {
    // load routes and hooks
    routes = require_(PATH.join(MODULES_ROOT, name, 'routes'))
    hooks = require_(PATH.join(MODULES_ROOT, name, 'hooks'))
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    console.log(e)
  }
  return {
  }
}

/**
 * All enabled modules
 */
function loadAll() {
  var items = {}
  var names = fs.readdirSync(__dirname)
  names.forEach(function(name) {
    if (fs.statSync(__dirname + '/' + name).isDirectory()) {
      debug('Loading module %s..', name)
      items[name] = loadModule(name)
    }
  })
  return items
}

exports.load = loadModule
exports.all = loadAll

