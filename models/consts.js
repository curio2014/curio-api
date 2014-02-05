var Named = require_('lib/named')

module.exports = {
  USER_LEVEL: Named({
    NORMAL: 0,
    ADMIN: 5,
    SUPER: 9,
  }),
  MEDIA_ADMIN: Named({
    CHIEF: 1,
    EDITOR: 2,
    AUDITOR: 3,
  }),
  MESSAGE_TYPES: Named({
    REPLY: 99,
    TEXT: 1,
    IMAGE: 2,
    LOCATION: 3,
    LINK: 4,
    VOICE: 5,
    VIDEO: 6,
    SUBSCRIBE: 20,
    UNSUBSCRIBE: 21,
    CLICK: 22,
    REPORT_LOC: 23,
  })
}
