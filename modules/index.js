/**
 * Modulized initialization
 */
var debug = require_('lib/utils/logger').debug('module')
var PATH = require('path')
var fs = require('fs')

var ROOT = 'modules'


function Module(name) {
  this.name = name
  this.dirname = PATH.join(__dirname, name)
}


Module.prototype.initialize = function() {
  var self = this

  debug('Initializing module %s..', self.name)

  // load routes and hooks
  var paths = ['routes', 'hooks'].map(function(name) {
    return PATH.join(self.dirname, name)
  })

  try {
    paths.forEach(function(filepath) {
      require(filepath)
    })
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND' ||  e.toString().indexOf(self.dirname) == -1) {
      throw e
    }
  }
  return self
}

function loadModule(name) {
  var mod = new Module(name)
  mod.initialize()
  return mod
}

/**
 * All enabled modules
 */
function loadAll() {
  var items = {}
  var names = fs.readdirSync(__dirname)
  names.forEach(function(name) {
    if (fs.statSync(__dirname + '/' + name).isDirectory()) {
      items[name] = loadModule(name)
    }
  })
  return items
}

exports.load = loadModule
exports.all = loadAll

