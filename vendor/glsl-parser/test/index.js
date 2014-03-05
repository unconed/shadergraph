var tokenizer = require('glsl-tokenizer')()
  , fs = require('fs')
  , parser = require('../index')
  , path = require('path').join(__dirname, 'test.glsl')

var num = 0
  , types = []

fs.createReadStream(path)
  .pipe(tokenizer)
  .pipe(parser())
  .on('data', function(x) {
    console.log(selector(x))
  })

function selector(x) {
  var list = []
  do {
    list.unshift(x.type)
  } while(x = x.parent)

  return list.join('/')
}
