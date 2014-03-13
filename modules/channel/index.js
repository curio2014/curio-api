var consts = require_('models/consts')

exports.level = consts.USER_LEVEL.NORMAL
exports.routes = require('./routes')
exports.hooks = require('./hooks')
