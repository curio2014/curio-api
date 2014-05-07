"use strict";
var __slice = [].slice
var _ = require_('lib/utils')
var debug = require_('lib/utils/logger').debug('db')

var Model = require('./model')


Model.upsert_ = Model.upsert
Model.upsert = function(uid, props) {
  var self = this
  if (_.isdigit(uid)) {
    props = props || {}
    props.id = uid
    return function(next) {
      debug('%s.upsert %j', self.modelName, props)
      self.upsert_(props, next)
    }
  }
  return function* () {
    var item = yield self.findOne({where: { uid: uid }, fresh: true})
    if (item) {
      yield item._clearCache
      return yield item.updateAttributes(props)
    }
    props.uid = uid
    item = yield self.create(props)
    return item
  }
}

/**
 * Generate a function with positional arguments,
 * to upsert an item with multiple property
 *
 * Examples:
 *
 *    Model.upsert = Model.upsertBy('media_id', 'name')
 *
 *    var name = 'some name',
 *    var media_id = Media.id
 *
 *    Model.upsert(media_id, name)
 */
Model.upsertBy = function() {
  var props = __slice.call(arguments)
  return function* upsertByProps() {
    var args, data, item
    args = __slice.call(arguments)
    if (args.length > props.length) {
      data = args.pop()
      args = args.slice(0, props.length)
    }
    var query = _.zipObject(props, args)
    var self = this

    function* findAndUpdate() {
      var ret = yield self.findOne({ where: query })
      if (ret && data) {
        yield ret.updateAttributes(data)
      }
      return ret
    }

    item = yield findAndUpdate()

    if (item) return item

    try {
      item = yield this.create(_.assign(data || {}, query))
    } catch (e) {
      // found duplicate, refind the item and update
      if (e.code == PG_DUPLICATE) {
        item = yield findAndUpdate()
      } else {
        throw e
      }
    }
    return item
  }
}

Model.destroyBy = function() {
  var props = __slice.call(arguments)
  var len = props.length
  return function* destroyByProps() {
    var args = __slice.call(arguments)
    if (args.length < len) {
      throw new Error('All arguments are required: ' + props.join(', '))
    }
    var query = _.zipObject(props, args)
    var items = yield this.all({ where: query })
    return yield items.map(function(item) { return item.destroy() })
  }
}
