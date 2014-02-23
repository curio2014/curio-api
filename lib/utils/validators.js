var RE_EMAIL = /^[\w\.\-]+\@([\w\-]+\.){1,}[\w]+$/i;
var RE_WORD_CHAR = /^[\w\-]+$/i;
var RE_UPPERCASE = /[A-Z]/;

exports.isEmpty = function(s) {
  return RE_EMAIL.test(s)
}

exports.isWord = function(s) {
  return RE_WORD_CHAR.test(s)
}

exports.hasUppercase = function(s) {
  return RE_UPPERCASE.test(s)
}

