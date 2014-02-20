/**
 * Auto reply rule for webot
 * Use leveldb to save the whole list for each media
 * Should be super fast!
 */
var log = require_('lib/utils/logger').log('responder')
var sandbox = require_('lib/utils/sandbox')
var store = require_('lib/store')('responder')

store.pickle = function(val) {
  return JSON.stringify(val, replacer)
}
store.unpickle = function(val) {
  return new Responder(val)
}


function Responder(raw) {
  this._raw = raw
}


/**
 * Get responder by media id
 */
Responder.load = function(media_id) {
  return store.get(media_id)
}

/**
 * @param rules, an array of webot rules
 */
Responder.dump = function(media_id, rules) {
  if (!Array.isArray(rules)) {
    throw new Error('Responder rules must be an array')
  }
  return store.set(media_id, rules)
}

Responder.clear = function(media_id) {
  return store.del(media_id)
}


/**
 * Convert this responder to webot rules,
 * with proper context attached
 */
Responder.prototype.webotfy = function(ctx) {
  var reviver = reviveFor(ctx)
  var self = this
  return JSON.parse(this._raw, reviver)
}


function reviveFor(ctx) {
  return function reviver(k, v) {
    if (v && v.pickled) {
      //try {
        return sandbox(ctx, v.value)
      //} catch (e) {
        //log('Unpickle %j failed', v)
        return ''
      //}
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

module.exports = Responder
