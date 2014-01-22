var http = require('http')
var consts = require('./consts')
var conf = require_('conf')

exports.assert = function(value, status, message, detail) {
  if (value) return
  var msg = 'string' === message ? message : message.message
  var err = new Error(msg)
  err.status = status || 500
  err.expose = true
  err.detail = detail
  err.code = message.code
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
          code: 404,
          error: 'not found'
        }
      }
    } catch (err) {
      this.status = err.status || 500

      if (this.status == 500) {
        // only 500 means application error
        this.app.emit('error', err, this)
      }

      if (conf.debug) {
        //console.log(err)
      }
      if (conf.debug || err.expose) {
        this.body = {
          code: err.code || this.status,
          detail: err.detail,
          error: err.message
        }
      } else {
        this.body = {
          code: this.status,
          error: http.STATUS_CODES[this.status]
        }
      }
    }
  }

}

exports.flash = function() {
  return function *flash(next) {
    var messages = this.session.messages || {}

    this.flash = function(category, text) {
      if (!text) {
        if (!(category in messages)) {
          return
        }
        text = messages[category]
        delete messages[category]
        return text
      }
      messages[category] = text
    }

    yield next

    if (Object.keys(messages).length) {
      this.session.messages = messages
    } else {
      delete this.session.messages
    }
  }
}