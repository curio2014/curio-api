module.exports = function(app) {

var pkg = require('../package.json')

app.use(require('koa-router')(app))


app.get('/', require('./bootstrap'))

}
