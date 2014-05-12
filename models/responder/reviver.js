"use strict";

/**
 * Decode customed rules from shortcuts configures
 */
module.exports = revive

var co = require('co')
var _ = require_('lib/utils')
var logError = require_('lib/utils/logger').error('app')
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
  assign(metaPattern, mapping)
  shared_rules.forEach(function(rule) {
    // replace existing shared rule's shortcodes
    if (rule.pattern in mapping) {
      rule.pattern = mapping[rule.pattern]
    }
  })
}
Responder.registerHandler = function(mapping) {
  assign(metaHandler, mapping, generatorToAsync)
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
  '$report_loc': function isReportLoc(info) {
    return info.is('event') && info.param.event == 'LOCATION'
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
  '$silent': function silentReply(info) {
    // silently ignore this message, no reply
    info.ended = true
    return ''
  }
}

function assign(metas, more, converter) {
  for (var k in more) {
    if (!more.hasOwnProperty(k)) continue
    if (k in metas) {
      throw new Error('shortcode "' + k + '" already exists')
    }
    metas[k] = converter ? converter(more[k]) : more[k]
  }
}

function generatorToAsync(fn) {
  if (_.isGeneratorFunction(fn)) {
    return function(info, next) {
      console.log(info)
      co(function* (info) {
        var err, ret
        try {
          ret = yield* fn
        } catch (e) {
          logError(e)
          // always break on thrown Error
          info.ended = true
        }
        console.log(ret)
        next(null, ret)
      }).call(this, info)
    }
  }
  return fn
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

function revivePattern(v) {
  if (Array.isArray(v)) {
    // Array is always keyword
    v = reviveKeywords(v)
  } else {
    v = unpickle(v, metaPattern)
  }
  return v
}

function reviveHandler(v) {
  v = unpickle(v, metaHandler)
  return v
}

function reviveKeywords(words) {
  var reg = []
  words.forEach(function(item) {
    if (!item.text) {
      // ignore bad keyword
      return
    }
    var text = escapeRegExpLiteral(item.text)
    if (item.blur) {
      reg.push(text)
    } else {
      reg.push('^' + text + '$')
    }
  })
  // always ignore cases
  return new RegExp(reg.join('|'), 'i')
}

function revive(rules) {
  var ret = []
  _.each(rules, function(rule, i) {
    rule = _.clone(rule)
    if ('pattern' in rule) {
      rule.pattern = revivePattern(rule.pattern)
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


function escapeRegExpLiteral(text) {
  return text.replace(/[\\\.\|\^\$\*\(\)\!]/g, '\\$&')
}
