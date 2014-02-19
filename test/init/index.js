function fillup(mod) {
  return function *(callback) {
    var result = yield require('./' + mod).fillup
    return result
  }
}

exports.fillup = fillup

exports.fillupAll = function *() {
  yield fillup('user')
  yield fillup('media')
  yield fillup('responder')
  yield fillup('message')
}
