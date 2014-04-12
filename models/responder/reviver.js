/**
 * Decode customed rules from shortcuts configures
 */
module.exports = revive

var _ = require_('lib/utils')
var sandbox = require_('lib/utils/sandbox')
var error = require_('lib/utils/logger').error('responder')
var Responder = require('./index')
var shared_rules = require('./shared')

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
  shared_rules.forEach(function(rule) {
    // replace existing shared rule's shortcodes
    if (rule.pattern in mapping) {
      rule.pattern = mapping[rule.pattern]
    }
  })
}
Responder.registerHandler = function(mapping) {
  _.assign(metaHandler, mapping)
  shared_rules.forEach(function(rule) {
    // replace existing shared rule's shortcodes
    if (rule.handler in mapping) {
      rule.handler = mapping[rule.handler]
    }
  })
}


metaPattern = {
  '$subscribe': function isSubscribe(info) {
    // user subscribe
    return info.is('event') && info.param.event == 'subscribe'
  },
  '$location': function isLocation(info) {
    return info.is('location')
  },
  '$any': function isAny(info) {
    // any text/voice/image messages
    return !info.is('event')
  },
  '$image': function isImage(info) {
    return info.is('image')
  },
}

metaHandler = {
  'silent': function silentReply(info) {
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
      return sandbox({}, v.value)
    } catch (e) {
      error('Unpickle %j failed', v)
      error(e)
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
  var ret = []
  _.each(rules, function(rule, i) {
    rule = _.clone(rule)
    if ('pattern' in rule) {
      rule.pattern = revivePattern(rule.pattern, rule.regFlag)
    }
    if ('handler' in rule) {
      rule.handler = reviveHandler(rule.handler)
    }
    // only add valid rules
    if (rule.pattern && rule.handler) {
      ret.push(rule)
    }
  })
  return ret
}

