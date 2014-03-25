var mediator = require_('lib/mediator')
var EVTS = require_('models/consts').GLOBAL_EVENTS
var stats = require('./models')

mediator.on(EVTS.SAVE_MESSAGES, stats.countMessages)

