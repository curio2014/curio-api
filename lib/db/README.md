# DB Schema, Model constructor

使用 `db.define` 创建 Model 。Model 是扩展过的 jugglingdb Model 。

主要用法有：

### Model.putter, Model.fetcher 和 Model.mfetcher

为 Model 定义异步获取远端数据的方法，可通过 `model.load('xxx')`
或者 `Model.get(id).attach('xxx')` 获取。

