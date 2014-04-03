/**
 * Auto reply rule for webot
 * Use leveldb to save the whole list for each media
 * Should be super fast!
 */
var Media = require_('models/media')
var log = require_('lib/utils/logger').log('responder')
var sandbox = require_('lib/utils/sandbox')
var store = require_('lib/store')('responder', {
  encode: pickle,
  decode: unpickle
})

module.exports = Responder


/**
 * A responder to manage all reply rules
 */
function Responder(media_id) {
  this._media_id = media_id
  this._shared = []
  this._customed = []
}

/**
 * Load customed rules
 */
Responder.prototype.load = function* () {
  var rules = yield store.get(this._media_id)
  this._customed = rules || []
}

/**
 * Clear customed rules
 */
Responder.prototype.clear = function() {
  return Responder.clear(this._media_id)
}

/**
 * All rules
 */
Responder.prototype.rules = function() {
  return this._shared.concat(this._customed)
}



var reviver = reviveFor(Responder.context)

function pickle(val) {
  return JSON.stringify(val, replacer)
}
function unpickle(val) {
  return JSON.parse(val, reviver)
}

function reviveFor(ctx) {
  return function reviver(k, v) {
    if (v && v.pickled) {
      try {
        return sandbox(ctx, v.value)
      } catch (e) {
        log('Unpickle %j failed', v)
        return
      }
    }
    return v
  }
}

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

/**
 * Get responder by media id
 */
Responder.get = function* (media_id) {
  var responder = new Responder(media_id)
  // load shared and customed rules parallelly
  yield [responder.load(), responder.loadShared()]
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

require('./shared')
