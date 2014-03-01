module.exports = {
  debug: false,
  port: 3301,
  root: 'http://api.curio.com',
  corsOrigin: 'http://www.curio.com',
  secret: 'say hello',
  salt: 'hello again',
  dbstore: './var/dbstore',
  redis: {
    prefix: 'curio:',
    // database: 3
    // host: ..
    // port: ..
    // password: ..
  },
  sessionStore: {
    prefix: 'curio:sess:'
  },
  postgres: {
    // host: ..
    // port: ..
    database: 'curio',
    username: 'curio',
    password: 'curio',
    charset: 'utf8'
    // ssl: ..
    // debug: ..
  }
}
