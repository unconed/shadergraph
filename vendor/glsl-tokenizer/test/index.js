var assert = require('assert')
  , fs = require('fs')
  , tokenizer = require('../index')
  , path = require('path').join(__dirname, 'test.glsl')

var glsl = fs.readFileSync(path, 'utf8')

fs.createReadStream(path)
  .pipe(tokenizer())
    .on('data', function(token) {
      if(token.data === '(eof)') {
        return
      }
      assert.equal(token.data, glsl.slice(token.position, token.position + token.data.length))
    })
