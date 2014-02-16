var debug = require('debug')('curio:test:init')

function fillup(mod) {
  return function *(callback) {
    var result = yield require('./' + mod).fillup
    return result
  }
}

exports.fillup = fillup

exports.fillupAll = function *() {

  debug('Filling up users...')
  yield fillup('user')

  debug('Filling up media...')
  yield fillup('media')

  debug('Filling up some messages...')
  yield fillup('message')

  debug('All done.')
}
