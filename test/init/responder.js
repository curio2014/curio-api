var debug = require_('lib/utils').debug('test:init')

var _ = require_('lib/utils')
var Responder = require_('models/responder')
var Media = require_('models/media')


var rules = [{
  pattern: {
    type: 'event'
    param: {
      event: 'subscribe'
    }
  },
  handler: 'thank your for your subscribe'
}, {
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
  pattern: { type: 'image' },
  handler: 'got your image'
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
  debug('Filling up responder..')

  var medias = yield Media.all()

  yield medias.map(responderGenerator)

  debug('Fill up responder done.')
}

