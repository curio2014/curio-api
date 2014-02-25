/**
 * like MySQL's ENUM()
 */

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
      id: id,
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

Named.prototype.get = function(idOrName) {
  return this.byId(idOrName) || this.byName(idOrName)
}

Named.prototype.byName = function(name) {
  return this._items_by_name[name]
}

Named.prototype.byId = function(id) {
  return this._items[id]
}


/**
 * Bind this named configure as data column for jugglingdb
 * Save as tinyint, but output as a named string
 */
Named.prototype.bind = function(model, attr, defination) {
  var self = this
  var raw_attr = '_' + attr
  defination = defination || { type: Number, dataType: 'tinyint', default: 0 }
  model.defineProperty(attr, defination)
  model.getter[attr] = function() {
    var item = self.byId(this[raw_attr] || 0)
    return item && item.name
  }
  model.setter[attr] = function(value) {
    var item = self.byName(value)
    if (item) {
      this[raw_attr] = item.value
    }
  }
  var _toObject = model.prototype.toObject
  model.prototype.toObject = function(onlySchema) {
    var ret = _toObject.call(this, onlySchema)
    if (onlySchema) {
      ret[attr] = this[raw_attr]
    }
    return ret
  }
}

module.exports = Named
