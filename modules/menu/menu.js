/**
 * 微信自定义菜单数据处理
 */
var Media = require_('models/media')
var log = require_('lib/utils/logger').log('menu')
var store = require_('lib/store')('menu')

module.exports = Menu

/**
 * 菜单
 */
function Menu(data) {
  if (!isNaN(Number(data))) {
    data = { media_id: data }
  }
  this._media_id = data.media_id;
  this._menu = data.menu || "";
}

/**
 * 加载菜单
 */
Menu.prototype.load = function* () {
  this._menu = yield store.get(this._media_id)
}

/**
 * 清除菜单
 */
Menu.prototype.destroy = function() {
  return Responder.clear(this._media_id)
}

/**
 * on dump customed wx menus when do toJSON
 */
Menu.prototype.toJSON = function() {
  return {
    media_id: this._media_id,
    menu: this._menu
  };
}

/**
 * Sync to wechat server
 */
Menu.prototype.sync = function* () {
  var media = yield Media.get(this._media_id)
  var wx = media.wx();
  var result = wx.createMenu(this._menu)

  return result
}


/**
 * Get menu by media id
 */
Menu.get = function* (media_id) {
  var menu = new Menu(media_id);
  yield menu.load();
  return menu;
}

/**
 * Save customed menu to storage
 *
 * @param menu, an json string of webot menu
 */
Menu.dump = function(media_id, menu) {
  if (!menu || menu.length <= 0) {
    throw new Error('Menu can not empty')
  }
  if (store.set(media_id, menu)) {
    return new Menu({ media_id: media_id, menu: menu })
  }
}

/**
 * Clear customed menu
 */
Menu.destroy = function(media_id) {
  return store.del(media_id)
}
