var Resource = require('./resource')

module.exports = function(model) {
  return Resource(model, ['index', 'create'])
}
