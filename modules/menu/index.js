/**
* 微信自定义菜单接口
*/

var mesa = require_('serve/mesa')
var Menu = require('./menu')
var ERRORS = require_('models/errors')

mesa.rest('/medias/:id/menu')
	.use(mesa.auth.need('mediaAdmin'))
	.get(function* () {
		console.log("获取菜单:"+this.params.id)

		// var menu_json='{"buttons":[{"name":"热门活动","sub_button":[{"name":"热门视频","type":"click","key":"video"},{"name":"必玩推荐","type":"click","key":"wan"},{"name":"精彩回顾","type":"click","key":"huigu"},{"name":"演出日历","type":"click","key":"calendar"}]},{"name":"Play","sub_button":[{"name":"罗志祥 Show Lo","type":"click","key":"lzx"}]},{"name":"服务","sub_button":[{"name":"Hotline 客服热线","type":"view","url":"http://kefu"},{"name":"VIP Room 贵宾服务","type":"click","key":"vip"},{"name":"Location 如何到达","type":"view","url":"http://map.baidu.com"},{"name":"Guide 畅游飞碟","type":"view","url":"feidie"}]}]}'
		// var ret = yield Menu.dump(this.params.id,menu_json)
		// console.log("保存:"+ret);

	 	this.body = yield Menu.get(this.params.id)
	 	//this.body={menu:'test get success'};
	})
	.post(function* saveMenu() {
		console.log("保存菜单信息:"+this.params.id)
		console.log("保存菜单信息:"+this.req.body.menu)
		yield Menu.dump(this.params.id,this.req.body.menu)
		this.body = { ok: true }
	})
