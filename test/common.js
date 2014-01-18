// define local require as a global
global.require_ = function(path) {
  return require(__dirname + '/' + path)
}

