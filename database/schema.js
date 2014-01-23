var db = require('../lib/db')
var consts = require('../models/consts')
var parallel = require('co-parallel')
var knex = db.knex

var CURRENT_TIMESTAMP = knex.raw('CURRENT_TIMESTAMP')
// conventinal helpers
var $ = function(table) {
  var ret = {};

  ret.timestamps = function() {
    table.dateTime('created_at')
      .defaultTo(CURRENT_TIMESTAMP)
    table.dateTime('updated_at')
      .defaultTo(CURRENT_TIMESTAMP)
      .onUpdate(CURRENT_TIMESTAMP)
    return ret
  }

  ret.need = function(the_id) {
    var tableName = the_id.replace('_id', '')
    table.integer(the_id).unsigned().notNullable()
      .references('id').inTable(tableName)
    return ret
  }

  return ret
}

var tasks = []
var queue = function(promise) {
  tasks.push(promise)
}

queue(knex.schema.createTable('user', function(table) {
  table.comment('Accounts to login the system')
  table.increments('id')
  $(table).timestamps()
  table.string('uid').unique()
    .comment('login name')
    .notNullable()
  table.string('email').unique()
  table.string('name')
    .comment('screen name')
    .notNullable().defaultTo('')
  table.string('desc')

  table.tinyint('level')
    .comment('User privilege level, default to 0')
    .notNullable().defaultTo(consts.USER_LEVEL.NORMAL)
}))

queue(knex.schema.createTable('passport', function(table) {
  table.comment('Login credentials')
  $(table).timestamps()
  table.string('user_id').unique().primary()
    .comment('login user id')
    .notNullable()
  table.string('password').notNullable()

}))

queue(knex.schema.createTable('media', function(table) {
  table.comment('Wechat accounts we manage')
  table.increments('id')
  $(table).timestamps()

  table.string('name').notNullable()
  table.string('desc')

  table.string('uid').unique()
    .comment('The id string when we search account in wechat')
    .notNullable()

  table.string('oid') // gh_x1x2x3
    .comment('Original ID, the real id for wechat backend')
    .notNullable()
}))

queue(knex.schema.createTable('media_admin', function(table) {
  table.comment('Which media a user can manage, and what role he/she is')
  table.increments('id')
  $(table).timestamps().need('media_id').need('user_id')
  table.tinyint('role')
    .comment('admin level, default to 1 (chief)')
    .notNullable().defaultTo(consts.MEDIA_ADMIN.CHIEF)
}))

queue(knex.schema.createTable('subscriber', function(table) {
  table.comment('Subscribers in wechat for the media account')
  table.increments('id')
  $(table).timestamps()


  table.string('openid').unique()
    .comment('The open id we got when user subscribe')

  table.string('fakeid').unique()
    .notNullable()
}))

queue(knex.schema.createTable('message', function(table) {
  table.comment('Messages between wechat users and the media account')
  table.bigIncrements('id')
  table.boolean('is_reply')
    .comment('whether this message is a reply to subscriber')
  table.dateTime('sent_at')
    .comment('when do we receive this message / send it to subscriber')
    .notNullable()
    .defaultTo(CURRENT_TIMESTAMP)
  table.json('content')
    .comment('message content, formated as json')
    .notNullable()
  $(table).need('media_id').need('subscriber_id')
}))

module.exports = function *() {
  return (yield parallel(tasks))
}
