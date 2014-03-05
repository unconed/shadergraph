glsl-parser
===========

a through stream that takes tokens from [glsl-tokenizer](https://github.com/chrisdickinson/glsl-tokenizer) and turns them into
an AST.

```javascript

var tokenizer = require('glsl-tokenizer')()
  , fs = require('fs')
  , parser = require('./index')

var num = 0

fs.createReadStream('test.glsl')
  .pipe(tokenizer)
  .pipe(parser())
  .on('data', function(x) {
    console.log('ast of', x.type)
  })

```

similar to [JSONStream](https://github.com/dominictarr/JSONStream), you may pass selectors
into the constructor to match only AST elements at that level. viable selectors are strings
and regexen, and they'll be matched against the emitted node's `type`.

nodes
-----

```

stmtlist
stmt
struct
function
functionargs
decl
decllist
forloop
whileloop
if
expr
precision
comment
preprocessor
keyword
ident
return
continue
break
discard
do-while
binary
ternary
unary

```

legal & caveats
===============

known bugs
----------

* because i am not smart enough to write a fully streaming parser, the current parser "cheats" a bit when it encounters a `expr` node! it actually waits until it has all the tokens it needs to build a tree for a given expression, then builds it and emits the constituent child nodes in the expected order. the `expr` parsing is heavily influenced by [crockford's tdop article](http://javascript.crockford.com/tdop/tdop.html). the rest of the parser is heavily influenced by fever dreams.

* the parser might hit a state where it's looking at what *could be* an expression, or it could be a declaration --
that is, the statement starts with a previously declared `struct`. it'll opt to pretend it's a declaration, but that
might not be the case -- it might be a user-defined constructor starting a statement!

* "unhygenic" `#if` / `#endif` macros are completely unhandled at the moment, since they're a bit of a pain.
if you've got unhygenic macros in your code, move the #if / #endifs to statement level, and have them surround
wholly parseable code. this sucks, and i am sorry.

license
-------

MIT
