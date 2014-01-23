var thunkify = require('thunkify')
var Schema = require('jugglingdb').Schema
var Model = require('jugglingdb').AbstractClass
var db = new Schema('postgres', require_('conf').postgres)


/**
 * Get by id(number) or uid(string)
 */
Model.get = thunkify(function getOne(id, cb) {
  if (isdigit(id)) return this.find(id, cb)
  return this.findOne({ where: {uid: id} }, cb)
})
// make all action yieldable
Model.all = thunkify(Model.all)
Model.upsert = thunkify(Model.upsert)
Model.count = thunkify(Model.count)

function isdigit(text) {
  return !isNaN(Number(text))
}

module.exports = db
