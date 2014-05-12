module.exports = {
  debug: false,
  port: 3301,
  root: 'http://api.curio.im',
  pagesRoot: 'http://curio.im',
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
    password: '',
    charset: 'utf8'
    // ssl: ..
    // debug: ..
  }
}
