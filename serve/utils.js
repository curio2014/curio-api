var http = require('http')
var consts = require('./consts')
var conf = require_('conf')

exports.assert = function(value, status, message) {
  if (value) return
  var msg = 'string' === message ? message : message.message
  var err = new Error(msg)
  err.status = status || 500
  err.expose = true
  err.original = message
  throw err
}

exports.error = function(opts) {

  // env
  var env = process.env.NODE_ENV || 'development'

  return function *error(next){
    try {
      yield next
      if (null == this.status) {
        this.status = 404
        this.body = {
          error: 'not found'
        }
      }
    } catch (err) {
      this.status = err.status || 500

      // application
      this.app.emit('error', err, this)

      if (conf.debug) {
        //console.log(err)
      }
      if (conf.debug || err.expose) {
        this.body = { error: err.message }
      } else {
        this.body = { error: http.STATUS_CODES[this.status] }
      }
    }
  }

}
