var Named = require_('lib/named')

module.exports = {
  AVAIL: Named({
    NORMAL: 0,
    DELETED: 1,
    HIDDEN: 2
  }),
  USER_LEVEL: Named({
    NORMAL: 0,
    ADMIN: 5,
    SUPER: 9,
  }),
  MEDIA_ADMIN: Named({
    CHIEF: 0,
    EDITOR: 1,
    AUDITOR: 2,
  }),
  MESSAGE_TYPES: Named({
    TEXT: 0,
    IMAGE: 1,
    LOCATION: 2,
    LINK: 3,
    VOICE: 4,
    VIDEO: 5,
    SUBSCRIBE: 20,
    UNSUBSCRIBE: 21,
    CLICK: 22,
    REPORT_LOC: 23,
    REPLY: 98, // a manual reply by media admin
    AUTO_REPLY: 99, // an auto reply with API
  })
}
