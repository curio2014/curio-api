var conf = require_('conf')
var queue = require('kue').createQueue({ redis: conf.redis })

module.exports = queue
