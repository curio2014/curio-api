var debug = require('debug')('curio:test:init')
var Responder = require_('models/responder')
var Media = require_('models/media')
var _ = require_('lib/utils')


var rules = [{
  pattern: { type: 'click' },
  handler: 'thank your for your subscribe'
} , {
  pattern: 'hello',
  handler: {
    type: 'news',
    content: [{
      title: 'abc',
      url: '/curio',
    }],
  },
}, {
  pattern: 'abc',
  handler: 'def',
}, {
  pattern: 'function test',
  handler: function (info) {
    return JSON.stringify(info.raw)
  },
}]

function responderGenerator(media, i) {
  return function*() {
    debug('Generating responder for %s', media.uid)
    yield Responder.dump(media.id, _.shuffle(rules))
  }
}


exports.fillup = function *(next) {
  var medias = yield Media.all()

  yield medias.map(responderGenerator)
}

