var log = require_('lib/utils/logger').log('test:init')

var _ = require_('lib/utils')
var Responder = require_('models/responder')
var Media = require_('models/media')


var rules = [{
  pattern: /function test/,
  handler: function (info) {
    return 'Current time:' + (new Date().toLocaleString())
  },
}, {
  pattern: '$subscribe',
  handler: 'thank your for your subscribe'
}, {
  pattern: 'news2',
  handler: {
    type: 'news',
    content: [{
      title: 'Multiple news in one',
      picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg',
      url: '/',
    }, {
      title: 'this is another title',
      picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg',
      url: '/',
    }],
  },
}, {
  pattern: 'news1',
  handler: {
    type: 'news',
    content: [{
      title: 'Cool, you got it!',
      picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg',
      url: '/',
    }],
  },
}, {
  pattern: 'news3',
  handler: {
    type: 'news',
    content: [{
      title: '这是一条图文消息',
      picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg',
      url: '/',
      description: 'Hello, this is me!'
    }],
  },
}, {
  pattern: '$location',
  handler: {
    type: 'image',
    picUrl: 'http://news.baidu.com/z/resource/r/image/2014-02-20/654a9ee49520c0e5b40ffc413e2fbd2d.jpg'
  },
}, {
  pattern: 'hello',
  handler: 'Got ya!',
}, {
  pattern: '$image',
  handler: 'got your image'
}]

function responderGenerator(media, i) {
  return function*() {
    yield Responder.dump(media.id, rules)
    log('Generated responder for %s.', media.uid)
  }
}


exports.fillup = function *(next) {
  log('Filling up responder..')

  var medias = yield Media.all()

  log('Got %s medias...', medias.length)
  yield medias.map(responderGenerator)

  log('Fill up responder done.')
}

