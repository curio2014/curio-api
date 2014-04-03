

module.exports = function sandbox(ctx, funcbody) {
  var rows = []
  if (ctx) {
    // override scope variables
    for (var k in ctx) {
      rows.push('var ' + k + ' = ctx[' + k + '];')
    }
  }
  rows.push('return ' + funcbody)
  // unsafe call stack variables are all undefined
  return (new Function('ctx', 'module', 'exports', 'globals', rows.join('\n')))(ctx)
}
