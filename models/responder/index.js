/**
 * Auto reply rule for webot
 * Use leveldb to save the whole list for each media
 * Should be super fast!
 */
var Media = require_('models/media')
var log = require_('lib/utils/logger').log('responder')
var store = require_('lib/store')('responder', {
  encode: pickle,
  decode: unpickle
})

module.exports = Responder


var shared_rules = require('./shared')

/**
 * A responder to manage all reply rules
 */
function Responder(data) {
  if (!isNaN(Number(data))) {
    data = { media_id: data }
  }
  this._media_id = data.media_id
  this._rules = data.rules || [] // the Array JSON text
  this._shared = shared_rules
}

/**
 * Load customed rules
 */
Responder.prototype.load = function* () {
  this._rules = yield store.get(this._media_id)
}

/**
 * Clear customed rules
 */
Responder.prototype.clear = function() {
  return Responder.clear(this._media_id)
}

/**
 * on dump customed rules when do toJSON
 */
Responder.prototype.toJSON = function() {
  return {
    media_id: this._media_id,
    rules: this._rules
  }
}


/**
 * Get responder by media id
 */
Responder.get = function* (media_id) {
  var responder = new Responder(media_id)
  yield responder.load()
  return responder
}

/**
 * Save customed rules to storage
 *
 * @param rules, an array of webot rules
 */
Responder.dump = function(media_id, rules) {
  if (!Array.isArray(rules)) {
    throw new Error('Responder rules must be an array')
  }
  return store.set(media_id, rules)
}

/**
 * Clear customed rules
 */
Responder.clear = function(media_id) {
  return store.del(media_id)
}


/**
 * Save a rule in a unified format
 */
function normalize(rule) {
  // TODO:
}


function pickle(val) {
  return JSON.stringify(val, replacer)
}
function unpickle(val) {
  return JSON.parse(val)
}
// make sure rules in storage are plain text/object,
// then you can write advanced rule in JavaScript
function replacer(k, v) {
  if (v instanceof RegExp) {
    return {
      pickled: 'regexp',
      value: v.toString()
    }
  }
  if ('function' == typeof v) {
    return {
      pickled: 'function',
      value: v.toString()
    }
  }
  return v
}



require('./reviver')
