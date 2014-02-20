var log = require_('lib/utils/logger').log('test:init')

var _ = require_('lib/utils')
var Responder = require_('models/responder')
var Media = require_('models/media')


var rules = [{
  pattern: {
    type: 'event',
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
  pattern: {
    type: 'location'
  },
  handler: {
    type: 'image',
    picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg'
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
    yield Responder.dump(media.id, _.shuffle(rules))
    log('Generated responder for %s.', media.uid)
  }
}


exports.fillup = function *(next) {
  log('Filling up responder..')

  var medias = yield Media.all()

  yield medias.map(responderGenerator)

  log('Fill up responder done.')
}

