/**
 * Decode customed rules from shortcuts configures
 */
var _ = require_('lib/utils')
var sandbox = require_('lib/utils/sandbox')
var Responder = require('./index')
var metaPattern, metaHandler

/**
 * All rules
 * converse customed rules for webot use
 */
Responder.prototype.rules = function() {
  return this._shared.concat(revive(this._rules))
}


/**
 * Register meta names for a handler or pattern
 *
 *    {
 *     'shortcode': function(info) {...}
 *    }
 */
Responder.registerPattern = function(mapping) {
  _.assign(metaPattern, mapping)
}
Responder.registerHandler = function(mapping) {
  _.assign(metaHandler, mapping)
}


metaPattern = {
  '$subscribe': function(info) {
    // user subscribe
    return info.is('event') && info.param.event == 'subscribe'
  },
  '$location': function(info) {
    return info.is('location')
  },
  '$any': function(info) {
    // any text/voice/image messages
    return !info.is('event')
  },
  '$image': function(info) {
    return info.is('image')
  },
}

metaHandler = {
  'silent': function(info) {
    // silently ignore this message, no reply
    info.ended = true
    return ''
  }
}


var RE_SHORTCODE = /\$\w+/i

function unpickle(v, metas) {
  if ('string' === typeof v) {
    if (v in metas) {
      v = metas[v]
    }
  } else if (v && v.pickled) {
    try {
      return sandbox(ctx, v.value)
    } catch (e) {
      log('Unpickle %j failed', v)
      return
    }
  }
  return v
}

function revivePattern(v, flag) {
  if (Array.isArray(v)) {
    v = new RegExp(v.join('|'), flag)
  } else {
    v = unpickle(v, metaPattern)
  }
  return v
}

function reviveHandler(v) {
  v = unpickle(v, metaHandler)
  return v
}

function revive(rules) {
  return _.map(rules, function(rule, i) {
    rule = _.clone(rule)
    if ('pattern' in rule) {
      rule.pattern = revivePattern(rule.pattern, rule.regFlag)
    }
    if ('handler' in rule) {
      rule.handler = reviveHandler(rule.handler)
    }
    return rule
  })
}


module.exports = revive
