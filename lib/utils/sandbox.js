

module.exports = function sandbox(ctx, funcbody) {
  var rows = []
    if (ctx) {
    // override scope variables
    rows.push(['var ' + Object.keys(ctx).join(',')])
    for (var k in ctx) {
      rorws.push(k + ' = ' + ctx[k] + ';')
    }
  }
  rows.push('return ' + funcbody)
  // context variables are all undefined
  return (new Function('module', 'exports', rows.join('\n')))()
}
