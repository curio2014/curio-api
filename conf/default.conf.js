module.exports = {
  debug: false,
  port: 3301,
  root: 'http://api.curio.com',
  corsOrigin: 'http://www.curio.com',
  secret: 'say hello',
  salt: 'hello again',
  redisStore: {
    prefix: 'curio:sess'
  },
  redis: {
    // host: ..
    // port: ..
    // database: ..
    // password: ..
  },
  postgres: {
    // host: ..
    // port: ..
    database: 'curio',
    user: 'curio',
    password: 'curio',
    charset: 'utf8'
    // ssl: ..
    // debug: ..
  }
}
