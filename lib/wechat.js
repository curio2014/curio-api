var Wechat = require('wechat-api')
var thunkify = require('thunkify')

var proto = Wechat.prototype

proto.createMenu = thunkify(proto.createMenu)
proto.getUserInfo = thunkify(proto.getUserInfo)
proto.getUserList = thunkify(proto.getUserList)
proto.createTempQRCode = thunkify(proto.createTempQRCode)
proto.createPermQRCode = thunkify(proto.createPermQRCode)
//proto.x = thunkify(x)


module.exports = Wechat
