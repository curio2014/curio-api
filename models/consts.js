var Named = require_('lib/named')

module.exports = {
  // global events can do mediator.on('xxx')
  GLOBAL_EVENTS: {
    SAVE_MESSAGES: 'save-messages'
  },
  AVAIL: Named({
    NORMAL: 0,
    DELETED: 1,
    HIDDEN: 2
  }),
  USER_LEVEL: Named({
    NORMAL: 0,
    ADMIN: 10,
    SUPER: 16,
  }),
  MEDIA_ADMIN: Named({
    CHIEF: 0,
    EDITOR: 1,
    AUDITOR: 2,
  }),
  MESSAGE_TYPES: Named({
    INCOMING: 0, // an incoming message from user
    OUTCOMING: 1, // 程序定时主动发送
    REPLY: 2,  // 触发自动回复
    MANUAL_REPLY: 3,  // 账号管理员主动回复
  }),
  MESSSAGE_CONTENT_TYPES: Named({
    TEXT: 0,
    IMAGE: 1,
    LOCATION: 2,
    LINK: 3,
    VOICE: 4,
    VIDEO: 5,
    SUBSCRIBE: 20, // 关注此微信号
    UNSUBSCRIBE: 21, // 退订账号
    CLICK: 22, // 点击自定义菜单
    REPORT_LOC: 23, // 上报地理位置，用户每次打开会话窗口时调用
    SCAN: 24, // 扫描某个二维码
    NEWS: 30, // 图文消息(只可能是下发消息)
    MUSIC: 31, // 音乐消息
    UNKNOWN: 99
  })
}
