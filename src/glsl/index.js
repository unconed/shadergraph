exports.compile  = require('./compile');
exports.parse    = require('./parse');
exports.generate = require('./generate');

const iterable = require('./constants');
for (let v = 0; v < iterable.length; v++) { const k = iterable[v]; exports[k] = v; }
