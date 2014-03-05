var tokenize = require('./index')

process.stdin.pipe(tokenize())
       .on('data', function(x) {
          console.log(x)
       })

process.stdin.resume()
