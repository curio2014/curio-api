var db = require('../lib/db')
var debug = require('debug')('curio:db_schema')

require('../models/user')
require('../models/media')
require('../models/channel')
require('../models/message')

exports.init = function(cb) {
  db.automigrate(cb);
}
