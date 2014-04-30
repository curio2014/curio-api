模块 Modules
------------

使用 module 组织功能模块

## 模块定义方式

一个典型的模块通常包含以下文件：

```
├── channel
│   ├── channel.js
│   ├── hooks.js
│   ├── index.js
│   └── routes.js
```

`index.js` 模块的入口文件，用于 export 可供其他模块调用的内容。但仍然应当尽量避免模块之间的依赖。
`hooks.js` 定义通过事件或HOOK，执行指定动作。如在接受特定种类消息时，存储内容。
`routes.js` 为网址 router 定义，指定在何个网址下提供 API 或呈现页面，相当于 views 。

其他文件可自行发挥。今后可能增加类似于 `manifest.json` 的配置文件。


## 各模块功能说明：

### Channel 推广渠道

一个 Channel 就是一个二维码场景。用户扫描二维码，服务器接受消息后将用户打上 channel tag 。


### Place 门店信息

管理员填写门店地址、坐标、详情页介绍信息，
用户发送位置，搜索附近门店。
用户点击门店详情后，将用户打上 place tag 。

门店可以关联二维码。


### Menu 自定义菜单


### Responder 自定义回复


### Stats 统计信息


