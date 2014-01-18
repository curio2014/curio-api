/**
* read configuration for different environment.
*/
var utils = require_('lib/utils')

module.exports = readConfig()

/**
* read config from #{NODE_ENV}.js
*/
function readConfig() {
  var NODE_ENV = global.process.env.NODE_ENV || 'development'
  var defaultConf = require('./default.conf.js')
  var conf = require('./' + NODE_ENV + '.conf.js')

  conf = utils.merge({}, defaultConf, conf)

  removeTailingSlash(conf, 'root')

  // cryptokey for session
  conf.secret = conf.secret || createRandomString()
  conf.salt = conf.salt || createRandomString()

  return conf
}

function removeTailingSlash(conf, k) {
  var str = conf[k]
  if (str && str[str.length - 1] == '/') {
    conf[k] = str.slice(0, -1)
  }
}

/**
* Random string for cryptoKey
* @return {string} randomString.
*/
function createRandomString() {
  var chars = '0123456789[ABCDEFGHIJKLMfi]NOPQRSTUVWXTZ#&*abcdefghiklmnopqrstuvwxyz';
  var string_length = 10
  var randomString = ''
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomString += chars.substring(rnum, rnum + 1)
  }
  return randomString
}
