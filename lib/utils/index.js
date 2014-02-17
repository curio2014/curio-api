var lodash = require('lodash')
var crc32 = require('buffer-crc32');

lodash.crc32 = crc32.unsigned

module.exports = lodash
