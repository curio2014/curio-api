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

  try {
    // load routes and hooks
    require(PATH.join(self.dirname, 'routes'))
    require(PATH.join(self.dirname, 'hooks'))
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    console.log(e)
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

