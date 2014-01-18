function Named(items, lower) {
  if (!(this instanceof Named)) {
    return new Named(items)
  }

  if (lower === undefined) {
    lower = true
  }

  this._items = {}
  this._items_by_name = {}
  this._list = []

  var k, value, id, item

  for (k in items) {
    value = items[k]
    id = value.id || value
    item = {
      value: value,
      name: lower ? k.toLowerCase() : k
    }
    this[k] = value
    this._items[id] = item
    this._items_by_name[item.name] = item
    this._list.push(item)
  }
}

Named.prototype.all = function() {
  return this._list
}

Named.prototype.byName = function(name) {
  return this._items_by_name[name]
}

Named.prototype.byId = function(id) {
  return this._items[id]
}


module.exports = Named
