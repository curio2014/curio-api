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
}
