module.exports = function(app) {

var rest = require('./base/rest')(app)
var auth = require('./auth')
var Resource = require('./base/resource')
var Collection = require('./base/collection')
var User = require_('models/user')
var Message = require_('models/message')
var Media = require_('models/media')

rest('/auth', auth)

rest('/medias', Collection(Media))
rest('/medias/:id(\\w+)', Resource(Media))
rest('/users', Collection(User))
rest('/users/:id', Resource(User))

rest('/messages', Collection(Message))
rest('/messages/:id', Resource(Message))

// get mediaAdmin by media/user
//rest('/medias/:media_id/users', require('./medias/admin'))
//rest('/users/:user_id/medias', require('./medias/admin'))

}
