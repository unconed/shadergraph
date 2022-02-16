(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("ShaderGraph", [], factory);
	else if(typeof exports === 'object')
		exports["ShaderGraph"] = factory();
	else
		root["ShaderGraph"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 706:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parse = __webpack_require__(324)

module.exports = parseArray

function parseArray(tokens) {
  var parser = parse()

  for (var i = 0; i < tokens.length; i++) {
    parser(tokens[i])
  }

  return parser(null)
}


/***/ }),

/***/ 268:
/***/ ((module) => {

var state
  , token
  , tokens
  , idx

var original_symbol = {
    nud: function() { return this.children && this.children.length ? this : fail('unexpected')() }
  , led: fail('missing operator')
}

var symbol_table = {}

function itself() {
  return this
}

symbol('(ident)').nud = itself
symbol('(keyword)').nud = itself
symbol('(builtin)').nud = itself
symbol('(literal)').nud = itself
symbol('(end)')

symbol(':')
symbol(';')
symbol(',')
symbol(')')
symbol(']')
symbol('}')

infixr('&&', 30)
infixr('||', 30)
infix('|', 43)
infix('^', 44)
infix('&', 45)
infix('==', 46)
infix('!=', 46)
infix('<', 47)
infix('<=', 47)
infix('>', 47)
infix('>=', 47)
infix('>>', 48)
infix('<<', 48)
infix('+', 50)
infix('-', 50)
infix('*', 60)
infix('/', 60)
infix('%', 60)
infix('?', 20, function(left) {
  this.children = [left, expression(0), (advance(':'), expression(0))]
  this.type = 'ternary'
  return this
})
infix('.', 80, function(left) {
  token.type = 'literal'
  state.fake(token)
  this.children = [left, token]
  advance()
  return this
})
infix('[', 80, function(left) {
  this.children = [left, expression(0)]
  this.type = 'binary'
  advance(']')
  return this
})
infix('(', 80, function(left) {
  this.children = [left]
  this.type = 'call'

  if(token.data !== ')') while(1) {
    this.children.push(expression(0))
    if(token.data !== ',') break
    advance(',')
  }
  advance(')')
  return this
})

prefix('-')
prefix('+')
prefix('!')
prefix('~')
prefix('defined')
prefix('(', function() {
  this.type = 'group'
  this.children = [expression(0)]
  advance(')')
  return this
})
prefix('++')
prefix('--')
suffix('++')
suffix('--')

assignment('=')
assignment('+=')
assignment('-=')
assignment('*=')
assignment('/=')
assignment('%=')
assignment('&=')
assignment('|=')
assignment('^=')
assignment('>>=')
assignment('<<=')

module.exports = function(incoming_state, incoming_tokens) {
  state = incoming_state
  tokens = incoming_tokens
  idx = 0
  var result

  if(!tokens.length) return

  advance()
  result = expression(0)
  result.parent = state[0]
  emit(result)

  if(idx < tokens.length) {
    throw new Error('did not use all tokens')
  }

  result.parent.children = [result]

  function emit(node) {
    state.unshift(node, false)
    for(var i = 0, len = node.children.length; i < len; ++i) {
      emit(node.children[i])
    }
    state.shift()
  }

}

function symbol(id, binding_power) {
  var sym = symbol_table[id]
  binding_power = binding_power || 0
  if(sym) {
    if(binding_power > sym.lbp) {
      sym.lbp = binding_power
    }
  } else {
    sym = Object.create(original_symbol)
    sym.id = id
    sym.lbp = binding_power
    symbol_table[id] = sym
  }
  return sym
}

function expression(rbp) {
  var left, t = token
  advance()

  left = t.nud()
  while(rbp < token.lbp) {
    t = token
    advance()
    left = t.led(left)
  }
  return left
}

function infix(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp)]
    this.type = 'binary'
    return this
  }
}

function infixr(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp - 1)]
    this.type = 'binary'
    return this
  }
  return sym
}

function prefix(id, nud) {
  var sym = symbol(id)
  sym.nud = nud || function() {
    this.children = [expression(70)]
    this.type = 'unary'
    return this
  }
  return sym
}

function suffix(id) {
  var sym = symbol(id, 150)
  sym.led = function(left) {
    this.children = [left]
    this.type = 'suffix'
    return this
  }
}

function assignment(id) {
  return infixr(id, 10, function(left) {
    this.children = [left, expression(9)]
    this.assignment = true
    this.type = 'assign'
    return this
  })
}

function advance(id) {
  var next
    , value
    , type
    , output

  if(id && token.data !== id) {
    return state.unexpected('expected `'+ id + '`, got `'+token.data+'`')
  }

  if(idx >= tokens.length) {
    token = symbol_table['(end)']
    return
  }

  next = tokens[idx++]
  value = next.data
  type = next.type

  if(type === 'ident') {
    output = state.scope.find(value) || state.create_node()
    type = output.type
  } else if(type === 'builtin') {
    output = symbol_table['(builtin)']
  } else if(type === 'keyword') {
    output = symbol_table['(keyword)']
  } else if(type === 'operator') {
    output = symbol_table[value]
    if(!output) {
      return state.unexpected('unknown operator `'+value+'`')
    }
  } else if(type === 'float' || type === 'integer') {
    type = 'literal'
    output = symbol_table['(literal)']
  } else {
    return state.unexpected('unexpected token.')
  }

  if(output) {
    if(!output.nud) { output.nud = itself }
    if(!output.children) { output.children = [] }
  }

  output = Object.create(output)
  output.token = next
  output.type = type
  if(!output.data) output.data = value

  return token = output
}

function fail(message) {
  return function() { return state.unexpected(message) }
}


/***/ }),

/***/ 324:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = parser

var full_parse_expr = __webpack_require__(268)
  , Scope = __webpack_require__(745)

// singleton!
var Advance = new Object

var DEBUG = false

var _ = 0
  , IDENT = _++
  , STMT = _++
  , STMTLIST = _++
  , STRUCT = _++
  , FUNCTION = _++
  , FUNCTIONARGS = _++
  , DECL = _++
  , DECLLIST = _++
  , FORLOOP = _++
  , WHILELOOP = _++
  , IF = _++
  , EXPR = _++
  , PRECISION = _++
  , COMMENT = _++
  , PREPROCESSOR = _++
  , KEYWORD = _++
  , KEYWORD_OR_IDENT = _++
  , RETURN = _++
  , BREAK = _++
  , CONTINUE = _++
  , DISCARD = _++
  , DOWHILELOOP = _++
  , PLACEHOLDER = _++
  , QUANTIFIER = _++

var DECL_ALLOW_ASSIGN = 0x1
  , DECL_ALLOW_COMMA = 0x2
  , DECL_REQUIRE_NAME = 0x4
  , DECL_ALLOW_INVARIANT = 0x8
  , DECL_ALLOW_STORAGE = 0x10
  , DECL_NO_INOUT = 0x20
  , DECL_ALLOW_STRUCT = 0x40
  , DECL_STATEMENT = 0xFF
  , DECL_FUNCTION = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_COMMA | DECL_NO_INOUT | DECL_ALLOW_INVARIANT | DECL_REQUIRE_NAME)
  , DECL_STRUCT = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_INVARIANT | DECL_ALLOW_STORAGE | DECL_ALLOW_STRUCT)

var QUALIFIERS = (/* unused pure expression or super */ null && (['const', 'attribute', 'uniform', 'varying']))

var NO_ASSIGN_ALLOWED = false
  , NO_COMMA_ALLOWED = false

// map of tokens to stmt types
var token_map = {
    'block-comment': COMMENT
  , 'line-comment': COMMENT
  , 'preprocessor': PREPROCESSOR
}

// map of stmt types to human
var stmt_type = _ = [
    'ident'
  , 'stmt'
  , 'stmtlist'
  , 'struct'
  , 'function'
  , 'functionargs'
  , 'decl'
  , 'decllist'
  , 'forloop'
  , 'whileloop'
  , 'if'
  , 'expr'
  , 'precision'
  , 'comment'
  , 'preprocessor'
  , 'keyword'
  , 'keyword_or_ident'
  , 'return'
  , 'break'
  , 'continue'
  , 'discard'
  , 'do-while'
  , 'placeholder'
  , 'quantifier'
]

function parser() {
  var stmtlist = n(STMTLIST)
    , stmt = n(STMT)
    , decllist = n(DECLLIST)
    , precision = n(PRECISION)
    , ident = n(IDENT)
    , keyword_or_ident = n(KEYWORD_OR_IDENT)
    , fn = n(FUNCTION)
    , fnargs = n(FUNCTIONARGS)
    , forstmt = n(FORLOOP)
    , ifstmt = n(IF)
    , whilestmt = n(WHILELOOP)
    , returnstmt = n(RETURN)
    , dowhilestmt = n(DOWHILELOOP)
    , quantifier = n(QUANTIFIER)

  var parse_struct
    , parse_precision
    , parse_quantifier
    , parse_forloop
    , parse_if
    , parse_return
    , parse_whileloop
    , parse_dowhileloop
    , parse_function
    , parse_function_args

  var check = arguments.length ? [].slice.call(arguments) : []
    , complete = false
    , ended = false
    , depth = 0
    , state = []
    , nodes = []
    , tokens = []
    , whitespace = []
    , errored = false
    , program
    , token
    , node

  // setup state
  state.shift = special_shift
  state.unshift = special_unshift
  state.fake = special_fake
  state.unexpected = unexpected
  state.scope = new Scope(state)
  state.create_node = function() {
    var n = mknode(IDENT, token)
    n.parent = reader.program
    return n
  }

  setup_stative_parsers()

  // setup root node
  node = stmtlist()
  node.expecting = '(eof)'
  node.mode = STMTLIST
  node.token = {type: '(program)', data: '(program)'}
  program = node

  reader.program = program
  reader.scope = function(scope) {
    if(arguments.length === 1) {
      state.scope = scope
    }
    return state.scope
  }

  state.unshift(node)
  return reader

  function reader(data) {
    if (data === null) {
      return end(), program
    }

    nodes = []
    write(data)
    return nodes
  }

  // stream functions ---------------------------------------------

  function write(input) {
    if(input.type === 'whitespace' || input.type === 'line-comment' || input.type === 'block-comment') {

      whitespace.push(input)
      return
    }
    tokens.push(input)
    token = token || tokens[0]

    if(token && whitespace.length) {
      token.preceding = token.preceding || []
      token.preceding = token.preceding.concat(whitespace)
      whitespace = []
    }

    while(take()) switch(state[0].mode) {
      case STMT: parse_stmt(); break
      case STMTLIST: parse_stmtlist(); break
      case DECL: parse_decl(); break
      case DECLLIST: parse_decllist(); break
      case EXPR: parse_expr(); break
      case STRUCT: parse_struct(true, true); break
      case PRECISION: parse_precision(); break
      case IDENT: parse_ident(); break
      case KEYWORD: parse_keyword(); break
      case KEYWORD_OR_IDENT: parse_keyword_or_ident(); break
      case FUNCTION: parse_function(); break
      case FUNCTIONARGS: parse_function_args(); break
      case FORLOOP: parse_forloop(); break
      case WHILELOOP: parse_whileloop(); break
      case DOWHILELOOP: parse_dowhileloop(); break
      case RETURN: parse_return(); break
      case IF: parse_if(); break
      case QUANTIFIER: parse_quantifier(); break
    }
  }

  function end(tokens) {
    if(arguments.length) {
      write(tokens)
    }

    if(state.length > 1) {
      unexpected('unexpected EOF')
      return
    }

    complete = true
  }

  function take() {
    if(errored || !state.length)
      return false

    return (token = tokens[0])
  }

  // ----- state manipulation --------

  function special_fake(x) {
    state.unshift(x)
    state.shift()
  }

  function special_unshift(_node, add_child) {
    _node.parent = state[0]

    var ret = [].unshift.call(this, _node)

    add_child = add_child === undefined ? true : add_child

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length - 1; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '\\'+_node.type, _node.token.data)
    }

    if(add_child && node !== _node) node.children.push(_node)
    node = _node

    return ret
  }

  function special_shift() {
    var _node = [].shift.call(this)
      , okay = check[this.length]
      , emit = false

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '/'+_node.type)
    }

    if(check.length) {
      if(typeof check[0] === 'function') {
        emit = check[0](_node)
      } else if(okay !== undefined) {
        emit = okay.test ? okay.test(_node.type) : okay === _node.type
      }
    } else {
      emit = true
    }

    if(emit && !errored) nodes.push(_node)

    node = _node.parent
    return _node
  }

  // parse states ---------------

  function parse_stmtlist() {
    // determine the type of the statement
    // and then start parsing
    return stative(
      function() { state.scope.enter(); return Advance }
    , normal_mode
    )()

    function normal_mode() {
      if(token.data === state[0].expecting) {
        return state.scope.exit(), state.shift()
      }
      switch(token.type) {
        case 'preprocessor':
          state.fake(adhoc())
          tokens.shift()
        return
        default:
          state.unshift(stmt())
        return
      }
    }
  }

  function parse_stmt() {
    if(state[0].brace) {
      if(token.data !== '}') {
        return unexpected('expected `}`, got '+token.data)
      }
      state[0].brace = false
      return tokens.shift(), state.shift()
    }
    switch(token.type) {
      case 'eof': return got_eof()
      case 'keyword':
        switch(token.data) {
          case 'for': return state.unshift(forstmt());
          case 'if': return state.unshift(ifstmt());
          case 'while': return state.unshift(whilestmt());
          case 'do': return state.unshift(dowhilestmt());
          case 'break': return state.fake(mknode(BREAK, token)), tokens.shift()
          case 'continue': return state.fake(mknode(CONTINUE, token)), tokens.shift()
          case 'discard': return state.fake(mknode(DISCARD, token)), tokens.shift()
          case 'return': return state.unshift(returnstmt());
          case 'precision': return state.unshift(precision());
        }
        return state.unshift(decl(DECL_STATEMENT))
      case 'ident':
        var lookup
        if(lookup = state.scope.find(token.data)) {
          if(lookup.parent.type === 'struct') {
            // this is strictly untrue, you could have an
            // expr that starts with a struct constructor.
            //      ... sigh
            return state.unshift(decl(DECL_STATEMENT))
          }
          return state.unshift(expr(';'))
        }
      case 'operator':
        if(token.data === '{') {
          state[0].brace = true
          var n = stmtlist()
          n.expecting = '}'
          return tokens.shift(), state.unshift(n)
        }
        if(token.data === ';') {
          return tokens.shift(), state.shift()
        }
      default: return state.unshift(expr(';'))
    }
  }

  function got_eof() {
    if (ended) errored = true
    ended = true
    return state.shift()
  }

  function parse_decl() {
    var stmt = state[0]

    return stative(
      invariant_or_not,
      storage_or_not,
      parameter_or_not,
      precision_or_not,
      struct_or_type,
      maybe_name,
      maybe_lparen,     // lparen means we're a function
      is_decllist,
      done
    )()

    function invariant_or_not() {
      if(token.data === 'invariant') {
        if(stmt.flags & DECL_ALLOW_INVARIANT) {
          state.unshift(keyword())
          return Advance
        } else {
          return unexpected('`invariant` is not allowed here')
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function storage_or_not() {
      if(is_storage(token)) {
        if(stmt.flags & DECL_ALLOW_STORAGE) {
          state.unshift(keyword())
          return Advance
        } else {
          return unexpected('storage is not allowed here')
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function parameter_or_not() {
      if(is_parameter(token)) {
        if(!(stmt.flags & DECL_NO_INOUT)) {
          state.unshift(keyword())
          return Advance
        } else {
          return unexpected('parameter is not allowed here')
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function precision_or_not() {
      if(is_precision(token)) {
        state.unshift(keyword())
        return Advance
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function struct_or_type() {
      if(token.data === 'struct') {
        if(!(stmt.flags & DECL_ALLOW_STRUCT)) {
          return unexpected('cannot nest structs')
        }
        state.unshift(struct())
        return Advance
      }

      if(token.type === 'keyword') {
        state.unshift(keyword())
        return Advance
      }

      var lookup = state.scope.find(token.data)

      if(lookup) {
        state.fake(Object.create(lookup))
        tokens.shift()
        return Advance
      }
      return unexpected('expected user defined type, struct or keyword, got '+token.data)
    }

    function maybe_name() {
      if(token.data === ',' && !(stmt.flags & DECL_ALLOW_COMMA)) {
        return state.shift()
      }

      if(token.data === '[') {
        // oh lord.
        state.unshift(quantifier())
        return
      }

      if(token.data === ')') return state.shift()

      if(token.data === ';') {
        return stmt.stage + 3
      }

      if(token.type !== 'ident' && token.type !== 'builtin') {
        return unexpected('expected identifier, got '+token.data)
      }

      stmt.collected_name = tokens.shift()
      return Advance
    }

    function maybe_lparen() {
      if(token.data === '(') {
        tokens.unshift(stmt.collected_name)
        delete stmt.collected_name
        state.unshift(fn())
        return stmt.stage + 2
      }
      return Advance
    }

    function is_decllist() {
      tokens.unshift(stmt.collected_name)
      delete stmt.collected_name
      state.unshift(decllist())
      return Advance
    }

    function done() {
      return state.shift()
    }
  }

  function parse_decllist() {
    // grab ident

    if(token.type === 'ident' || token.type === 'builtin') {
      var name = token.data
      state.unshift(ident())
      state.scope.define(name)
      return
    }

    if(token.type === 'operator') {

      if(token.data === ',') {
        // multi-decl!
        if(!(state[1].flags & DECL_ALLOW_COMMA)) {
          return state.shift()
        }

        return tokens.shift()
      } else if(token.data === '=') {
        if(!(state[1].flags & DECL_ALLOW_ASSIGN)) return unexpected('`=` is not allowed here.')

        tokens.shift()

        state.unshift(expr(',', ';'))
        return
      } else if(token.data === '[') {
        state.unshift(quantifier())
        return
      }
    }
    return state.shift()
  }

  function parse_keyword_or_ident() {
    if(token.type === 'keyword') {
      state[0].type = 'keyword'
      state[0].mode = KEYWORD
      return
    }

    if(token.type === 'ident') {
      state[0].type = 'ident'
      state[0].mode = IDENT
      return
    }

    return unexpected('expected keyword or user-defined name, got '+token.data)
  }

  function parse_keyword() {
    if(token.type !== 'keyword') {
      return unexpected('expected keyword, got '+token.data)
    }

    return state.shift(), tokens.shift()
  }

  function parse_ident() {
    if(token.type !== 'ident' && token.type !== 'builtin') {
      return unexpected('expected user-defined name, got '+token.data)
    }

    state[0].data = token.data
    return state.shift(), tokens.shift()
  }


  function parse_expr() {
    var expecting = state[0].expecting

    state[0].tokens = state[0].tokens || []

    if(state[0].parenlevel === undefined) {
      state[0].parenlevel = 0
      state[0].bracelevel = 0
    }
    if(state[0].parenlevel < 1 && expecting.indexOf(token.data) > -1) {
      return parseexpr(state[0].tokens)
    }
    if(token.data === '(') {
      ++state[0].parenlevel
    } else if(token.data === ')') {
      --state[0].parenlevel
    }

    switch(token.data) {
      case '{': ++state[0].bracelevel; break
      case '}': --state[0].bracelevel; break
      case '(': ++state[0].parenlevel; break
      case ')': --state[0].parenlevel; break
    }

    if(state[0].parenlevel < 0) return unexpected('unexpected `)`')
    if(state[0].bracelevel < 0) return unexpected('unexpected `}`')

    state[0].tokens.push(tokens.shift())
    return

    function parseexpr(tokens) {
      try {
        full_parse_expr(state, tokens)
      } catch(err) {
        errored = true
        throw err
      }

      return state.shift()
    }
  }

  // node types ---------------

  function n(type) {
    // this is a function factory that suffices for most kinds of expressions and statements
    return function() {
      return mknode(type, token)
    }
  }

  function adhoc() {
    return mknode(token_map[token.type], token, node)
  }

  function decl(flags) {
    var _ = mknode(DECL, token, node)
    _.flags = flags

    return _
  }

  function struct(allow_assign, allow_comma) {
    var _ = mknode(STRUCT, token, node)
    _.allow_assign = allow_assign === undefined ? true : allow_assign
    _.allow_comma = allow_comma === undefined ? true : allow_comma
    return _
  }

  function expr() {
    var n = mknode(EXPR, token, node)

    n.expecting = [].slice.call(arguments)
    return n
  }

  function keyword(default_value) {
    var t = token
    if(default_value) {
      t = {'type': '(implied)', data: '(default)', position: t.position}
    }
    return mknode(KEYWORD, t, node)
  }

  // utils ----------------------------

  function unexpected(str) {
    errored = true
    throw new Error(
      (str || 'unexpected '+state) +
      ' at line '+state[0].token.line
    )
  }

  function assert(type, data) {
    return 1,
      assert_null_string_or_array(type, token.type) &&
      assert_null_string_or_array(data, token.data)
  }

  function assert_null_string_or_array(x, y) {
    switch(typeof x) {
      case 'string': if(y !== x) {
        unexpected('expected `'+x+'`, got '+y+'\n'+token.data);
      } return !errored

      case 'object': if(x && x.indexOf(y) === -1) {
        unexpected('expected one of `'+x.join('`, `')+'`, got '+y);
      } return !errored
    }
    return true
  }

  // stative ----------------------------

  function stative() {
    var steps = [].slice.call(arguments)
      , step
      , result

    return function() {
      var current = state[0]

      current.stage || (current.stage = 0)

      step = steps[current.stage]
      if(!step) return unexpected('parser in undefined state!')

      result = step()

      if(result === Advance) return ++current.stage
      if(result === undefined) return
      current.stage = result
    }
  }

  function advance(op, t) {
    t = t || 'operator'
    return function() {
      if(!assert(t, op)) return

      var last = tokens.shift()
        , children = state[0].children
        , last_node = children[children.length - 1]

      if(last_node && last_node.token && last.preceding) {
        last_node.token.succeeding = last_node.token.succeeding || []
        last_node.token.succeeding = last_node.token.succeeding.concat(last.preceding)
      }
      return Advance
    }
  }

  function advance_expr(until) {
    return function() {
      state.unshift(expr(until))
      return Advance
    }
  }

  function advance_ident(declare) {
    return declare ? function() {
      var name = token.data
      return assert('ident') && (state.unshift(ident()), state.scope.define(name), Advance)
    } :  function() {
      if(!assert('ident')) return

      var s = Object.create(state.scope.find(token.data))
      s.token = token

      return (tokens.shift(), Advance)
    }
  }

  function advance_stmtlist() {
    return function() {
      var n = stmtlist()
      n.expecting = '}'
      return state.unshift(n), Advance
    }
  }

  function maybe_stmtlist(skip) {
    return function() {
      var current = state[0].stage
      if(token.data !== '{') { return state.unshift(stmt()), current + skip }
      return tokens.shift(), Advance
    }
  }

  function popstmt() {
    return function() { return state.shift(), state.shift() }
  }


  function setup_stative_parsers() {

    // could also be
    // struct { } decllist
    parse_struct =
        stative(
          advance('struct', 'keyword')
        , function() {
            if(token.data === '{') {
              state.fake(mknode(IDENT, {data:'', position: token.position, type:'ident'}))
              return Advance
            }

            return advance_ident(true)()
          }
        , function() { state.scope.enter(); return Advance }
        , advance('{')
        , function() {
            if(token.type === 'preprocessor') {
              state.fake(adhoc())
              tokens.shift()
              return
            }
            if(token.data === '}') {
              state.scope.exit()
              tokens.shift()
              return state.shift()
            }
            if(token.data === ';') { tokens.shift(); return }
            state.unshift(decl(DECL_STRUCT))
          }
        )

    parse_precision =
        stative(
          function() { return tokens.shift(), Advance }
        , function() {
            return assert(
            'keyword', ['lowp', 'mediump', 'highp']
            ) && (state.unshift(keyword()), Advance)
          }
        , function() { return (state.unshift(keyword()), Advance) }
        , function() { return state.shift() }
        )

    parse_quantifier =
        stative(
          advance('[')
        , advance_expr(']')
        , advance(']')
        , function() { return state.shift() }
        )

    parse_forloop =
        stative(
          advance('for', 'keyword')
        , advance('(')
        , function() {
            var lookup
            if(token.type === 'ident') {
              if(!(lookup = state.scope.find(token.data))) {
                lookup = state.create_node()
              }

              if(lookup.parent.type === 'struct') {
                return state.unshift(decl(DECL_STATEMENT)), Advance
              }
            } else if(token.type === 'builtin' || token.type === 'keyword') {
              return state.unshift(decl(DECL_STATEMENT)), Advance
            }
            return advance_expr(';')()
          }
        , advance(';')
        , advance_expr(';')
        , advance(';')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_if =
        stative(
          advance('if', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , function() {
            if(token.data === 'else') {
              return tokens.shift(), state.unshift(stmt()), Advance
            }
            return popstmt()()
          }
        , popstmt()
        )

    parse_return =
        stative(
          advance('return', 'keyword')
        , function() {
            if(token.data === ';') return Advance
            return state.unshift(expr(';')), Advance
          }
        , function() { tokens.shift(), popstmt()() }
        )

    parse_whileloop =
        stative(
          advance('while', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_dowhileloop =
      stative(
        advance('do', 'keyword')
      , maybe_stmtlist(3)
      , advance_stmtlist()
      , advance('}')
      , advance('while', 'keyword')
      , advance('(')
      , advance_expr(')')
      , advance(')')
      , popstmt()
      )

    parse_function =
      stative(
        function() {
          for(var i = 1, len = state.length; i < len; ++i) if(state[i].mode === FUNCTION) {
            return unexpected('function definition is not allowed within another function')
          }

          return Advance
        }
      , function() {
          if(!assert("ident")) return

          var name = token.data
            , lookup = state.scope.find(name)

          state.unshift(ident())
          state.scope.define(name)

          state.scope.enter(lookup ? lookup.scope : null)
          return Advance
        }
      , advance('(')
      , function() { return state.unshift(fnargs()), Advance }
      , advance(')')
      , function() {
          // forward decl
          if(token.data === ';') {
            return state.scope.exit(), state.shift(), state.shift()
          }
          return Advance
        }
      , advance('{')
      , advance_stmtlist()
      , advance('}')
      , function() { state.scope.exit(); return Advance }
      , function() { return state.shift(), state.shift(), state.shift() }
      )

    parse_function_args =
      stative(
        function() {
          if(token.data === 'void') { state.fake(keyword()); tokens.shift(); return Advance }
          if(token.data === ')') { state.shift(); return }
          if(token.data === 'struct') {
            state.unshift(struct(NO_ASSIGN_ALLOWED, NO_COMMA_ALLOWED))
            return Advance
          }
          state.unshift(decl(DECL_FUNCTION))
          return Advance
        }
      , function() {
          if(token.data === ',') { tokens.shift(); return 0 }
          if(token.data === ')') { state.shift(); return }
          unexpected('expected one of `,` or `)`, got '+token.data)
        }
      )
  }
}

function mknode(mode, sourcetoken) {
  return {
      mode: mode
    , token: sourcetoken
    , children: []
    , type: stmt_type[mode]
    , id: (Math.random() * 0xFFFFFFFF).toString(16)
  }
}

function is_storage(token) {
  return token.data === 'const' ||
         token.data === 'attribute' ||
         token.data === 'uniform' ||
         token.data === 'varying'
}

function is_parameter(token) {
  return token.data === 'in' ||
         token.data === 'inout' ||
         token.data === 'out'
}

function is_precision(token) {
  return token.data === 'highp' ||
         token.data === 'mediump' ||
         token.data === 'lowp'
}


/***/ }),

/***/ 745:
/***/ ((module) => {

module.exports = scope

function scope(state) {
  if(this.constructor !== scope)
    return new scope(state)

  this.state = state
  this.scopes = []
  this.current = null
}

var cons = scope
  , proto = cons.prototype

proto.enter = function(s) {
  this.scopes.push(
    this.current = this.state[0].scope = s || {}
  )
}

proto.exit = function() {
  this.scopes.pop()
  this.current = this.scopes[this.scopes.length - 1]
}

proto.define = function(str) {
  this.current[str] = this.state[0]
}

proto.find = function(name, fail) {
  for(var i = this.scopes.length - 1; i > -1; --i) {
    if(this.scopes[i].hasOwnProperty(name)) {
      return this.scopes[i][name]
    }
  }

  return null
}


/***/ }),

/***/ 460:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = tokenize

var literals100 = __webpack_require__(529)
  , operators = __webpack_require__(679)
  , builtins100 = __webpack_require__(222)
  , literals300es = __webpack_require__(914)
  , builtins300es = __webpack_require__(537)

var NORMAL = 999          // <-- never emitted
  , TOKEN = 9999          // <-- never emitted
  , BLOCK_COMMENT = 0
  , LINE_COMMENT = 1
  , PREPROCESSOR = 2
  , OPERATOR = 3
  , INTEGER = 4
  , FLOAT = 5
  , IDENT = 6
  , BUILTIN = 7
  , KEYWORD = 8
  , WHITESPACE = 9
  , EOF = 10
  , HEX = 11

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
]

function tokenize(opt) {
  var i = 0
    , total = 0
    , mode = NORMAL
    , c
    , last
    , content = []
    , tokens = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , col = 0
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len

  opt = opt || {}
  var allBuiltins = builtins100
  var allLiterals = literals100
  if (opt.version === '300 es') {
    allBuiltins = builtins300es
    allLiterals = literals300es
  }

  // cache by name
  var builtinsDict = {}, literalsDict = {}
  for (var i = 0; i < allBuiltins.length; i++) {
    builtinsDict[allBuiltins[i]] = true
  }
  for (var i = 0; i < allLiterals.length; i++) {
    literalsDict[allLiterals[i]] = true
  }

  return function(data) {
    tokens = []
    if (data !== null) return write(data)
    return end()
  }

  function token(data) {
    if (data.length) {
      tokens.push({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      , column: col
      })
    }
  }

  function write(chunk) {
    i = 0

    if (chunk.toString) chunk = chunk.toString()

    input += chunk.replace(/\r\n/g, '\n')
    len = input.length


    var last

    while(c = input[i], i < len) {
      last = i

      switch(mode) {
        case BLOCK_COMMENT: i = block_comment(); break
        case LINE_COMMENT: i = line_comment(); break
        case PREPROCESSOR: i = preprocessor(); break
        case OPERATOR: i = operator(); break
        case INTEGER: i = integer(); break
        case HEX: i = hex(); break
        case FLOAT: i = decimal(); break
        case TOKEN: i = readtoken(); break
        case WHITESPACE: i = whitespace(); break
        case NORMAL: i = normal(); break
      }

      if(last !== i) {
        switch(input[last]) {
          case '\n': col = 0; ++line; break
          default: ++col; break
        }
      }
    }

    total += i
    input = input.slice(i)
    return tokens
  }

  function end(chunk) {
    if(content.length) {
      token(content.join(''))
    }

    mode = EOF
    token('(eof)')
    return tokens
  }

  function normal() {
    content = content.length ? [] : content

    if(last === '/' && c === '*') {
      start = total + i - 1
      mode = BLOCK_COMMENT
      last = c
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1
      mode = LINE_COMMENT
      last = c
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR
      start = total + i
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE
      start = total + i
      return i
    }

    isnum = /\d/.test(c)
    isoperator = /[^\w_]/.test(c)

    start = total + i
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN
    return i
  }

  function whitespace() {
    if(/[^\s]/g.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function preprocessor() {
    if((c === '\r' || c === '\n') && last !== '\\') {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c)
      token(content.join(''))
      mode = NORMAL
      return i + 1
    }

    content.push(c)
    last = c
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));

      mode = FLOAT
      return i
    }

    if(c === ';' || c === ')' || c === '(') {
      if(content.length) while(determine_operator(content));
      token(c)
      mode = NORMAL
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '='
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , idx
      , res

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''))
      res = operators[idx]

      if(idx === -1) {
        if(j-- + buf.length > 0) continue
        res = buf.slice(0, 1).join('')
      }

      token(res)

      start += res.length
      content = content.slice(res.length)
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function integer() {
    if(c === '.') {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c)
      last = c
      i += 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      last = c
      return i + 1
    }

    if ((c === '-' || c === '+') && /[eE]/.test(last)) {
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('')
      if(literalsDict[contentstr]) {
        mode = KEYWORD
      } else if(builtinsDict[contentstr]) {
        mode = BUILTIN
      } else {
        mode = IDENT
      }
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }
}


/***/ }),

/***/ 537:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// 300es builtins/reserved words that were previously valid in v100
var v100 = __webpack_require__(222)

// The texture2D|Cube functions have been removed
// And the gl_ features are updated
v100 = v100.slice().filter(function (b) {
  return !/^(gl\_|texture)/.test(b)
})

module.exports = v100.concat([
  // the updated gl_ constants
    'gl_VertexID'
  , 'gl_InstanceID'
  , 'gl_Position'
  , 'gl_PointSize'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragDepth'
  , 'gl_PointCoord'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformVectors'
  , 'gl_MaxVertexOutputVectors'
  , 'gl_MaxFragmentInputVectors'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformVectors'
  , 'gl_MaxDrawBuffers'
  , 'gl_MinProgramTexelOffset'
  , 'gl_MaxProgramTexelOffset'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'

  // other builtins
  , 'trunc'
  , 'round'
  , 'roundEven'
  , 'isnan'
  , 'isinf'
  , 'floatBitsToInt'
  , 'floatBitsToUint'
  , 'intBitsToFloat'
  , 'uintBitsToFloat'
  , 'packSnorm2x16'
  , 'unpackSnorm2x16'
  , 'packUnorm2x16'
  , 'unpackUnorm2x16'
  , 'packHalf2x16'
  , 'unpackHalf2x16'
  , 'outerProduct'
  , 'transpose'
  , 'determinant'
  , 'inverse'
  , 'texture'
  , 'textureSize'
  , 'textureProj'
  , 'textureLod'
  , 'textureOffset'
  , 'texelFetch'
  , 'texelFetchOffset'
  , 'textureProjOffset'
  , 'textureLodOffset'
  , 'textureProjLod'
  , 'textureProjLodOffset'
  , 'textureGrad'
  , 'textureGradOffset'
  , 'textureProjGrad'
  , 'textureProjGradOffset'
])


/***/ }),

/***/ 222:
/***/ ((module) => {

module.exports = [
  // Keep this list sorted
  'abs'
  , 'acos'
  , 'all'
  , 'any'
  , 'asin'
  , 'atan'
  , 'ceil'
  , 'clamp'
  , 'cos'
  , 'cross'
  , 'dFdx'
  , 'dFdy'
  , 'degrees'
  , 'distance'
  , 'dot'
  , 'equal'
  , 'exp'
  , 'exp2'
  , 'faceforward'
  , 'floor'
  , 'fract'
  , 'gl_BackColor'
  , 'gl_BackLightModelProduct'
  , 'gl_BackLightProduct'
  , 'gl_BackMaterial'
  , 'gl_BackSecondaryColor'
  , 'gl_ClipPlane'
  , 'gl_ClipVertex'
  , 'gl_Color'
  , 'gl_DepthRange'
  , 'gl_DepthRangeParameters'
  , 'gl_EyePlaneQ'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_Fog'
  , 'gl_FogCoord'
  , 'gl_FogFragCoord'
  , 'gl_FogParameters'
  , 'gl_FragColor'
  , 'gl_FragCoord'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_FragDepthEXT'
  , 'gl_FrontColor'
  , 'gl_FrontFacing'
  , 'gl_FrontLightModelProduct'
  , 'gl_FrontLightProduct'
  , 'gl_FrontMaterial'
  , 'gl_FrontSecondaryColor'
  , 'gl_LightModel'
  , 'gl_LightModelParameters'
  , 'gl_LightModelProducts'
  , 'gl_LightProducts'
  , 'gl_LightSource'
  , 'gl_LightSourceParameters'
  , 'gl_MaterialParameters'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxDrawBuffers'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxLights'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_ModelViewMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_Normal'
  , 'gl_NormalMatrix'
  , 'gl_NormalScale'
  , 'gl_ObjectPlaneQ'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_Point'
  , 'gl_PointCoord'
  , 'gl_PointParameters'
  , 'gl_PointSize'
  , 'gl_Position'
  , 'gl_ProjectionMatrix'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_TextureEnvColor'
  , 'gl_TextureMatrix'
  , 'gl_TextureMatrixInverse'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_Vertex'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'inversesqrt'
  , 'length'
  , 'lessThan'
  , 'lessThanEqual'
  , 'log'
  , 'log2'
  , 'matrixCompMult'
  , 'max'
  , 'min'
  , 'mix'
  , 'mod'
  , 'normalize'
  , 'not'
  , 'notEqual'
  , 'pow'
  , 'radians'
  , 'reflect'
  , 'refract'
  , 'sign'
  , 'sin'
  , 'smoothstep'
  , 'sqrt'
  , 'step'
  , 'tan'
  , 'texture2D'
  , 'texture2DLod'
  , 'texture2DProj'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
  , 'texture2DLodEXT'
  , 'texture2DProjLodEXT'
  , 'textureCubeLodEXT'
  , 'texture2DGradEXT'
  , 'texture2DProjGradEXT'
  , 'textureCubeGradEXT'
]


/***/ }),

/***/ 914:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var v100 = __webpack_require__(529)

module.exports = v100.slice().concat([
   'layout'
  , 'centroid'
  , 'smooth'
  , 'case'
  , 'mat2x2'
  , 'mat2x3'
  , 'mat2x4'
  , 'mat3x2'
  , 'mat3x3'
  , 'mat3x4'
  , 'mat4x2'
  , 'mat4x3'
  , 'mat4x4'
  , 'uvec2'
  , 'uvec3'
  , 'uvec4'
  , 'samplerCubeShadow'
  , 'sampler2DArray'
  , 'sampler2DArrayShadow'
  , 'isampler2D'
  , 'isampler3D'
  , 'isamplerCube'
  , 'isampler2DArray'
  , 'usampler2D'
  , 'usampler3D'
  , 'usamplerCube'
  , 'usampler2DArray'
  , 'coherent'
  , 'restrict'
  , 'readonly'
  , 'writeonly'
  , 'resource'
  , 'atomic_uint'
  , 'noperspective'
  , 'patch'
  , 'sample'
  , 'subroutine'
  , 'common'
  , 'partition'
  , 'active'
  , 'filter'
  , 'image1D'
  , 'image2D'
  , 'image3D'
  , 'imageCube'
  , 'iimage1D'
  , 'iimage2D'
  , 'iimage3D'
  , 'iimageCube'
  , 'uimage1D'
  , 'uimage2D'
  , 'uimage3D'
  , 'uimageCube'
  , 'image1DArray'
  , 'image2DArray'
  , 'iimage1DArray'
  , 'iimage2DArray'
  , 'uimage1DArray'
  , 'uimage2DArray'
  , 'image1DShadow'
  , 'image2DShadow'
  , 'image1DArrayShadow'
  , 'image2DArrayShadow'
  , 'imageBuffer'
  , 'iimageBuffer'
  , 'uimageBuffer'
  , 'sampler1DArray'
  , 'sampler1DArrayShadow'
  , 'isampler1D'
  , 'isampler1DArray'
  , 'usampler1D'
  , 'usampler1DArray'
  , 'isampler2DRect'
  , 'usampler2DRect'
  , 'samplerBuffer'
  , 'isamplerBuffer'
  , 'usamplerBuffer'
  , 'sampler2DMS'
  , 'isampler2DMS'
  , 'usampler2DMS'
  , 'sampler2DMSArray'
  , 'isampler2DMSArray'
  , 'usampler2DMSArray'
])


/***/ }),

/***/ 529:
/***/ ((module) => {

module.exports = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'for'
  , 'while'
  , 'if'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'uint'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
]


/***/ }),

/***/ 679:
/***/ ((module) => {

module.exports = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^^'
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
]


/***/ }),

/***/ 932:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var tokenize = __webpack_require__(460)

module.exports = tokenizeString

function tokenizeString(str, opt) {
  var generator = tokenize(opt)
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}


/***/ }),

/***/ 760:
/***/ ((__unused_webpack_module, exports) => {

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
exports.make = function (x) {
  if (x == null) {
    x = [];
  }
  if (!(x instanceof Array)) {
    x = [+x != null ? +x : 0];
  }
  return x;
};

exports.nest = (a, b) => a.concat(b);

exports.compare = function (a, b) {
  const n = Math.min(a.length, b.length);
  for (
    let i = 0, end = n, asc = 0 <= end;
    asc ? i < end : i > end;
    asc ? i++ : i--
  ) {
    const p = a[i];
    const q = b[i];
    if (p > q) {
      return -1;
    }
    if (p < q) {
      return 1;
    }
  }
  a = a.length;
  b = b.length;
  if (a > b) {
    return -1;
  } else if (a < b) {
    return 1;
  } else {
    return 0;
  }
};

exports.max = function (a, b) {
  if (exports.compare(a, b) > 0) {
    return b;
  } else {
    return a;
  }
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "ShaderGraph": () => (/* binding */ ShaderGraph),
  "inspect": () => (/* binding */ src_inspect),
  "load": () => (/* binding */ src_load),
  "visualize": () => (/* binding */ src_visualize)
});

// NAMESPACE OBJECT: ./src/graph/index.js
var src_graph_namespaceObject = {};
__webpack_require__.r(src_graph_namespaceObject);
__webpack_require__.d(src_graph_namespaceObject, {
  "Graph": () => (Graph),
  "IN": () => (IN),
  "Node": () => (node_Node),
  "OUT": () => (OUT),
  "Outlet": () => (Outlet)
});

// NAMESPACE OBJECT: ./src/linker/index.js
var linker_namespaceObject = {};
__webpack_require__.r(linker_namespaceObject);
__webpack_require__.d(linker_namespaceObject, {
  "Layout": () => (Layout),
  "Program": () => (Program),
  "Snippet": () => (Snippet),
  "assemble": () => (assemble),
  "compare": () => (linker_priority.compare),
  "link": () => (link_link),
  "load": () => (load),
  "make": () => (linker_priority.make),
  "max": () => (linker_priority.max),
  "nest": () => (linker_priority.nest)
});

// NAMESPACE OBJECT: ./src/visualize/markup.js
var markup_namespaceObject = {};
__webpack_require__.r(markup_namespaceObject);
__webpack_require__.d(markup_namespaceObject, {
  "merge": () => (merge),
  "overlay": () => (overlay),
  "process": () => (process)
});

// NAMESPACE OBJECT: ./src/visualize/index.js
var visualize_namespaceObject = {};
__webpack_require__.r(visualize_namespaceObject);
__webpack_require__.d(visualize_namespaceObject, {
  "inspect": () => (inspect),
  "markup": () => (markup),
  "serialize": () => (visualize_serialize),
  "visualize": () => (visualize)
});

// NAMESPACE OBJECT: ./src/factory/index.js
var src_factory_namespaceObject = {};
__webpack_require__.r(src_factory_namespaceObject);
__webpack_require__.d(src_factory_namespaceObject, {
  "Factory": () => (Factory),
  "Material": () => (Material),
  "cache": () => (cache),
  "hash": () => (hash),
  "library": () => (library),
  "queue": () => (queue)
});

// NAMESPACE OBJECT: ./node_modules/three/src/math/Vector3.js
var Vector3_namespaceObject = {};
__webpack_require__.r(Vector3_namespaceObject);
__webpack_require__.d(Vector3_namespaceObject, {
  "P": () => (Vector3)
});

// NAMESPACE OBJECT: ./src/glsl/index.js
var glsl_namespaceObject = {};
__webpack_require__.r(glsl_namespaceObject);
__webpack_require__.d(glsl_namespaceObject, {
  "RETURN_ARG": () => (RETURN_ARG),
  "SHADOW_ARG": () => (SHADOW_ARG),
  "body": () => (body),
  "build": () => (build),
  "call": () => (call),
  "compile": () => (compile),
  "dedupe": () => (dedupe),
  "define": () => (generate_define),
  "defuse": () => (defuse),
  "fn": () => (fn),
  "hoist": () => (hoist),
  "invoke": () => (invoke),
  "lines": () => (lines),
  "link": () => (generate_link),
  "links": () => (links),
  "list": () => (list),
  "parse": () => (parse),
  "same": () => (same),
  "statements": () => (statements),
  "unshadow": () => (unshadow),
  "walk": () => (walk)
});

;// CONCATENATED MODULE: ./src/graph/graph.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Graph of nodes with outlets
*/
class Graph {
  static initClass() {
    this.index = 0;

    this.IN = 0;
    this.OUT = 1;
  }
  // eslint-disable-next-line no-unused-vars
  static id(name) {
    return ++Graph.index;
  }

  constructor(nodes, parent = null) {
    this.parent = parent;
    this.id = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  inputs() {
    const inputs = [];
    for (let node of Array.from(this.nodes)) {
      for (let outlet of Array.from(node.inputs)) {
        if (outlet.input === null) {
          inputs.push(outlet);
        }
      }
    }
    return inputs;
  }

  outputs() {
    const outputs = [];
    for (let node of Array.from(this.nodes)) {
      for (let outlet of Array.from(node.outputs)) {
        if (outlet.output.length === 0) {
          outputs.push(outlet);
        }
      }
    }
    return outputs;
  }

  getIn(name) {
    return Array.from(this.inputs()).filter(
      (outlet) => outlet.name === name
    )[0];
  }
  getOut(name) {
    return Array.from(this.outputs()).filter(
      (outlet) => outlet.name === name
    )[0];
  }

  add(node, ignore) {
    if (node.length) {
      for (let _node of Array.from(node)) {
        this.add(_node);
      }
      return;
    }

    if (node.graph && !ignore) {
      throw new Error("Adding node to two graphs at once");
    }

    node.graph = this;
    this.nodes.push(node);
  }

  remove(node, ignore) {
    if (node.length) {
      for (let _node of Array.from(node)) {
        this.remove(_node);
      }
      return;
    }

    if (node.graph !== this) {
      throw new Error("Removing node from wrong graph.");
    }

    ignore || node.disconnect();

    this.nodes.splice(this.nodes.indexOf(node), 1);
    node.graph = null;
  }

  adopt(node) {
    if (node.length) {
      for (let _node of Array.from(node)) {
        this.adopt(_node);
      }
      return;
    }

    node.graph.remove(node, true);
    this.add(node, true);
  }
}
Graph.initClass();

;// CONCATENATED MODULE: ./src/graph/outlet.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


/*
  In/out outlet on node
*/
class Outlet {
  static initClass() {
    this.index = 0;
  }
  static make(outlet, extra) {
    if (extra == null) {
      extra = {};
    }
    const meta = extra;
    if (outlet.meta != null) {
      for (let key in outlet.meta) {
        const value = outlet.meta[key];
        meta[key] = value;
      }
    }
    return new Outlet(
      outlet.inout,
      outlet.name,
      outlet.hint,
      outlet.type,
      meta
    );
  }
  static id(name) {
    return `_io_${++Outlet.index}_${name}`;
  }

  static hint(name) {
    name = name.replace(/^_io_[0-9]+_/, "");
    name = name.replace(/_i_o$/, "");
    return (name = name.replace(/(In|Out|Inout|InOut)$/, ""));
  }

  constructor(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    if (meta == null) {
      meta = {};
    }
    this.meta = meta;
    this.id = id;
    if (this.hint == null) {
      this.hint = Outlet.hint(this.name);
    }

    this.node = null;
    this.input = null;
    this.output = [];
    if (this.id == null) {
      this.id = Outlet.id(this.hint);
    }
  }

  // Change into given outlet without touching connections
  morph(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return (this.meta = outlet.meta);
  }

  // Copy with unique name and cloned metadata
  dupe(name) {
    if (name == null) {
      name = this.id;
    }
    const outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  }

  // Connect to given outlet
  connect(outlet) {
    // Auto-reverse in/out to out/in
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }

    // Disallow bad combinations
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw new Error("Can only connect out to in.");
    }

    // Check for existing connection
    if (outlet.input === this) {
      return;
    }

    // Disconnect existing connections
    outlet.disconnect();

    // Add new connection.
    outlet.input = this;
    return this.output.push(outlet);
  }

  // Disconnect given outlet (or all)
  disconnect(outlet) {
    // Disconnect input from the other side.
    if (this.input) {
      this.input.disconnect(this);
    }

    if (this.output.length) {
      if (outlet) {
        // Remove one outgoing connection.
        const index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return (outlet.input = null);
        }
      } else {
        // Remove all outgoing connections.
        for (outlet of Array.from(this.output)) {
          outlet.input = null;
        }
        return (this.output = []);
      }
    }
  }
}
Outlet.initClass();

;// CONCATENATED MODULE: ./src/graph/node.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
 Node in graph.
*/
class node_Node {
  static initClass() {
    this.index = 0;
  }
  static id(name) {
    return ++node_Node.index;
  }

  constructor(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = node_Node.id();

    this.setOutlets(outlets);
  }

  // Retrieve input
  getIn(name) {
    return Array.from(this.inputs).filter((outlet) => outlet.name === name)[0];
  }

  // Retrieve output
  getOut(name) {
    return Array.from(this.outputs).filter((outlet) => outlet.name === name)[0];
  }

  // Retrieve by name
  get(name) {
    return this.getIn(name) || this.getOut(name);
  }

  // Set new outlet definition
  setOutlets(outlets) {
    if (outlets != null) {
      // First init
      let outlet;
      if (this.outlets == null) {
        this.outlets = {};
        for (outlet of Array.from(outlets)) {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }

      // Return new/old outlet matching hash key
      const hash = (
        outlet // Match by name, direction and type.
      ) => [outlet.name, outlet.inout, outlet.type].join("-");

      // Build hash of new outlets
      const match = {};
      for (outlet of Array.from(outlets)) {
        match[hash(outlet)] = true;
      }

      // Remove missing outlets, record matches
      for (let key in this.outlets) {
        outlet = this.outlets[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }

      // Insert new outlets
      for (outlet of Array.from(outlets)) {
        // Find match by hash
        const existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          // Update existing outlets in place to retain connections.
          this._morph(existing, outlet);
        } else {
          // Spawn new outlet
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }

      this;
    }
    return this.outlets;
  }

  // Connect to the target node by matching up inputs and outputs.
  connect(node, empty, force) {
    let dest, dests, hint, source, type;
    const outlets = {};
    const hints = {};

    const typeHint = (outlet) => type + "/" + outlet.hint;

    // Hash the types/hints of available target outlets.
    for (dest of Array.from(node.inputs)) {
      // Only autoconnect if not already connected
      var list;
      if (!force && dest.input) {
        continue;
      }

      // Match outlets by type/name hint, then type/position key
      ({ type } = dest);
      hint = typeHint(dest);

      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }

    // Available source outlets
    let sources = this.outputs;

    // Ignore connected source if only matching empties.
    sources = sources.filter((outlet) => !(empty && outlet.output.length));

    // Match hints first
    for (source of Array.from(sources.slice())) {
      // Match outlets by type and name
      ({ type } = source);
      hint = typeHint(source);
      dests = outlets[type];

      // Connect if found
      if ((dest = hints[hint])) {
        source.connect(dest);

        // Remove from potential set
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }

    // Match what's left
    if (!sources.length) {
      return this;
    }
    for (source of Array.from(sources.slice())) {
      ({ type } = source);
      dests = outlets[type];

      // Match outlets by type and order
      if (dests && dests.length) {
        // Link up and remove from potential set
        source.connect(dests.shift());
      }
    }

    return this;
  }

  // Disconnect entire node
  disconnect(node) {
    let outlet;
    for (outlet of Array.from(this.inputs)) {
      outlet.disconnect();
    }
    for (outlet of Array.from(this.outputs)) {
      outlet.disconnect();
    }

    return this;
  }

  // Return hash key for outlet
  _key(outlet) {
    return [outlet.name, outlet.inout].join("-");
  }

  // Add outlet object to node
  _add(outlet) {
    const key = this._key(outlet);

    // Sanity checks
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error(`Adding two identical outlets to same node. (${key})`);
    }

    // Link back outlet
    outlet.node = this;

    // Add to name hash and inout list
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return (this.outlets[key] = outlet);
  }

  // Morph outlet to other
  _morph(existing, outlet) {
    let key = this._key(outlet);
    delete this.outlets[key];

    existing.morph(outlet);

    key = this._key(outlet);
    return (this.outlets[key] = outlet);
  }

  // Remove outlet object from node.
  _remove(outlet) {
    const key = this._key(outlet);
    const { inout } = outlet;

    // Sanity checks
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }

    // Disconnect outlet.
    outlet.disconnect();

    // Unlink outlet.
    outlet.node = null;

    // Remove from name list and inout list.
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  }
}
node_Node.initClass();

;// CONCATENATED MODULE: ./src/graph/index.js

const { IN, OUT } = Graph;





;// CONCATENATED MODULE: ./src/linker/snippet.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Snippet {
  static initClass() {
    this.index = 0;
  }
  static namespace() {
    return `_sn_${++Snippet.index}_`;
  }

  static load(language, name, code) {
    const program = language.parse(name, code);
    const [sigs, compiler] = Array.from(language.compile(program));
    return new Snippet(language, sigs, compiler, name, code);
  }

  constructor(language, _signatures, _compiler, _name, _original) {
    this.language = language;
    this._signatures = _signatures;
    this._compiler = _compiler;
    this._name = _name;
    this._original = _original;
    this.namespace = null;
    this.code = null;

    this.main = null;
    this.entry = null;

    this.uniforms = null;
    this.externals = null;
    this.symbols = null;
    this.attributes = null;
    this.varyings = null;

    // Tidy up object for export
    if (!this.language) {
      delete this.language;
    }
    if (!this._signatures) {
      delete this._signatures;
    }
    if (!this._compiler) {
      delete this._compiler;
    }
    if (!this._original) {
      delete this._original;
    }

    // Insert snippet name if not provided
    if (!this._name) {
      this._name =
        this._signatures != null ? this._signatures.main.name : undefined;
    }
  }

  clone() {
    return new Snippet(
      this.language,
      this._signatures,
      this._compiler,
      this._name,
      this._original
    );
  }

  bind(config, uniforms, namespace, defines) {
    // Alt syntax (namespace, uniforms, defines)
    let def, left;
    let v;
    if (uniforms === "" + uniforms) {
      [namespace, uniforms, defines] = Array.from([
        uniforms,
        namespace != null ? namespace : {},
        defines != null ? defines : {},
      ]);
      // Alt syntax (uniforms, defines)
    } else if (namespace !== "" + namespace) {
      [defines, namespace] = Array.from([
        namespace != null ? namespace : {},
        undefined,
      ]);
    }

    // Prepare data structure
    this.main = this._signatures.main;
    this.namespace =
      (left = namespace != null ? namespace : this.namespace) != null
        ? left
        : Snippet.namespace();
    this.entry = this.namespace + this.main.name;

    this.uniforms = {};
    this.varyings = {};
    this.attributes = {};
    this.externals = {};
    this.symbols = [];
    const exist = {};
    const exceptions = {};

    // Handle globals and locals for prefixing
    const global = function (name) {
      exceptions[name] = true;
      return name;
    };
    const local = (name) => {
      return this.namespace + name;
    };

    // Apply config
    if (config.globals) {
      for (let key of Array.from(config.globals)) {
        global(key);
      }
    }
    const _u = config.globalUniforms ? global : local;
    const _v = config.globalVaryings ? global : local;
    const _a = config.globalAttributes ? global : local;
    const _e = local;

    // Build finalized properties
    const x = (def) => {
      return (exist[def.name] = true);
    };
    const u = (def, name) => {
      return (this.uniforms[_u(name != null ? name : def.name)] = def);
    };
    v = (def) => {
      return (this.varyings[_v(def.name)] = def);
    };
    const a = (def) => {
      return (this.attributes[_a(def.name)] = def);
    };
    const e = (def) => {
      const name = _e(def.name);
      this.externals[name] = def;
      return this.symbols.push(name);
    };

    const redef = (def) => ({
      type: def.type,
      name: def.name,
      value: def.value,
    });

    for (def of Array.from(this._signatures.uniform)) {
      x(def);
    }
    for (def of Array.from(this._signatures.uniform)) {
      u(redef(def));
    }
    for (def of Array.from(this._signatures.varying)) {
      v(redef(def));
    }
    for (def of Array.from(this._signatures.external)) {
      e(def);
    }
    for (def of Array.from(this._signatures.attribute)) {
      a(redef(def));
    }
    for (let name in uniforms) {
      def = uniforms[name];
      if (exist[name]) {
        u(def, name);
      }
    }

    this.body = this.code = this._compiler(this.namespace, exceptions, defines);

    // Adds defs to original snippet for inspection
    if (defines) {
      const defs = (() => {
        const result = [];
        for (let k in defines) {
          v = defines[k];
          result.push(`#define ${k} ${v}`);
        }
        return result;
      })().join("\n");
      if (defs.length) {
        this._original = [
          defs,
          "//----------------------------------------",
          this._original,
        ].join("\n");
      }
    }

    return null;
  }
}
Snippet.initClass();

// EXTERNAL MODULE: ./src/linker/priority.js
var linker_priority = __webpack_require__(760);
;// CONCATENATED MODULE: ./src/linker/assemble.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
*/
const assemble = function (language, namespace, calls, requires) {
  const generate = language;

  const externals = {};
  const symbols = [];
  const uniforms = {};
  const varyings = {};
  const attributes = {};
  const library = {};

  const process = function () {
    let body;
    let ns;
    for (ns in requires) {
      const r = requires[ns];
      required(r.node, r.module);
    }

    [body, calls] = Array.from(handle(calls));
    if (namespace != null) {
      body.entry = namespace;
    }
    const main = generate.build(body, calls);

    const sorted = (() => {
      const result = [];
      for (ns in library) {
        const lib = library[ns];
        result.push(lib);
      }
      return result;
    })().sort((a, b) => linker_priority.compare(a.priority, b.priority));
    const includes = sorted.map((x) => x.code);
    includes.push(main.code);
    const code = generate.lines(includes);

    // Build new virtual snippet
    return {
      namespace: main.name,
      library, // Included library functions
      body: main.code, // Snippet body
      code, // Complete snippet (tests/debug)
      main, // Function signature
      entry: main.name, // Entry point name
      symbols,
      externals,
      uniforms,
      varyings,
      attributes,
    };
  };

  // Sort and process calls
  var handle = (calls) => {
    let c;
    calls = (() => {
      const result = [];
      for (let ns in calls) {
        c = calls[ns];
        result.push(c);
      }
      return result;
    })();
    calls.sort((a, b) => b.priority - a.priority);

    // Call module in DAG chain
    const call = (node, module, priority) => {
      include(node, module, priority);
      const { main } = module;
      const { entry } = module;

      const _lookup = (name) => lookup(node, name);
      const _dangling = (name) => isDangling(node, name);
      return generate.call(_lookup, _dangling, entry, main.signature, body);
    };

    var body = generate.body();
    for (c of Array.from(calls)) {
      call(c.node, c.module, c.priority);
    }

    return [body, calls];
  };

  // Adopt given code as a library at given priority
  const adopt = function (namespace, code, priority) {
    const record = library[namespace];
    if (record != null) {
      return (record.priority = linker_priority.max(record.priority, priority));
    } else {
      return (library[namespace] = { code, priority });
    }
  };

  // Include snippet for a call
  var include = function (node, module, priority) {
    let def, key;
    priority = linker_priority.make(priority);

    // Adopt snippet's libraries
    for (let ns in module.library) {
      const lib = module.library[ns];
      adopt(ns, lib.code, linker_priority.nest(priority, lib.priority));
    }

    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);

    // Adopt GL vars
    for (key in module.uniforms) {
      def = module.uniforms[key];
      uniforms[key] = def;
    }
    for (key in module.varyings) {
      def = module.varyings[key];
      varyings[key] = def;
    }
    for (key in module.attributes) {
      def = module.attributes[key];
      attributes[key] = def;
    }

    return required(node, module);
  };

  var required = (
    node,
    module // Adopt external symbols
  ) =>
    (() => {
      const result = [];
      for (let key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        if (isDangling(node, ext.name)) {
          const copy = {};
          for (let k in ext) {
            const v = ext[k];
            copy[k] = v;
          }
          copy.name = lookup(node, ext.name);
          externals[key] = copy;
          result.push(symbols.push(key));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();

  // Check for dangling input/output
  var isDangling = function (node, name) {
    const outlet = node.get(name);

    if (outlet.inout === IN) {
      return outlet.input === null;
    } else if (outlet.inout === OUT) {
      return outlet.output.length === 0;
    }
  };

  // Look up unique name for outlet
  var lookup = function (node, name) {
    // Traverse graph edge
    let outlet = node.get(name);
    if (!outlet) {
      return null;
    }

    if (outlet.input) {
      outlet = outlet.input;
    }
    ({ name } = outlet);

    return outlet.id;
  };

  return process();
};

;// CONCATENATED MODULE: ./src/linker/program.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
  Program assembly model

  Snippets are added to its queue, registering calls and code includes.
  Calls are de-duped and scheduled at the earliest point required for correct data flow.

  When assemble() is called, it builds a main() function to
  execute all calls in final order.

  The result is a new instance of Snippet that acts as if it
  was parsed from the combined source of the component
  nodes.
*/
class Program {
  static initClass() {
    this.index = 0;
  }
  static entry() {
    return `_pg_${++Program.index}_`;
  }

  // Program starts out empty, ready to compile starting from a particular block
  constructor(language, namespace, graph) {
    this.language = language;
    this.namespace = namespace;
    this.graph = graph;
    this.calls = {};
    this.requires = {};
  }

  // Call a given module at certain priority
  call(node, module, priority) {
    let exists;
    const ns = module.namespace;

    // Merge all calls down into one with the right priority
    if ((exists = this.calls[ns])) {
      exists.priority = Math.max(exists.priority, priority);
    } else {
      this.calls[ns] = { node, module, priority };
    }

    return this;
  }

  // Require a given (callback) module's externals
  require(node, module) {
    const ns = module.namespace;
    return (this.requires[ns] = { node, module });
  }

  // Compile queued ops into result
  assemble() {
    const data = assemble(
      this.language,
      this.namespace != null ? this.namespace : Program.entry,
      this.calls,
      this.requires
    );
    const snippet = new Snippet();
    for (let key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  }
}
Program.initClass();

;// CONCATENATED MODULE: ./src/linker/link.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
 Callback linker

 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
*/

const link_link = function (language, links, modules, exported) {
  const generate = language;
  let includes = [];

  const symbols = [];
  const externals = {};
  const uniforms = {};
  const attributes = {};
  const varyings = {};
  const library = {};

  const process = function () {
    const exports = generate.links(links);

    const header = [];
    if (exports.defs != null) {
      header.push(exports.defs);
    }
    if (exports.bodies != null) {
      header.push(exports.bodies);
    }

    for (let m of Array.from(modules)) {
      include(m.node, m.module, m.priority);
    }
    const sorted = (() => {
      const result = [];
      for (let ns in library) {
        const lib = library[ns];
        result.push(lib);
      }
      return result;
    })().sort((a, b) => linker_priority.compare(a.priority, b.priority));
    includes = sorted.map((x) => x.code);

    let code = generate.lines(includes);
    code = generate.defuse(code);
    if (header.length) {
      code = [generate.lines(header), code].join("\n");
    }
    code = generate.hoist(code);
    code = generate.dedupe(code);

    // Export module's externals
    const e = exported;
    return {
      namespace: e.main.name,
      code, // Complete snippet (tests/debug)
      main: e.main, // Function signature
      entry: e.main.name, // Entry point name
      externals,
      uniforms,
      attributes,
      varyings,
    };
  };

  // Adopt given code as a library at given priority
  const adopt = function (namespace, code, priority) {
    const record = library[namespace];
    if (record != null) {
      return (record.priority = linker_priority.max(record.priority, priority));
    } else {
      return (library[namespace] = { code, priority });
    }
  };

  // Include piece of code
  var include = function (node, module, priority) {
    let def, key;
    priority = linker_priority.make(priority);

    // Adopt snippet's libraries
    for (let ns in module.library) {
      const lib = module.library[ns];
      adopt(ns, lib.code, linker_priority.nest(priority, lib.priority));
    }

    // Adopt snippet body as library
    adopt(module.namespace, module.body, priority);

    // Adopt externals
    for (key in module.uniforms) {
      def = module.uniforms[key];
      uniforms[key] = def;
    }
    for (key in module.varyings) {
      def = module.varyings[key];
      varyings[key] = def;
    }
    for (key in module.attributes) {
      def = module.attributes[key];
      attributes[key] = def;
    }

    return (() => {
      const result = [];
      for (key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        if (isDangling(node, ext.name)) {
          externals[key] = ext;
          result.push(symbols.push(key));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  };

  // Check for dangling input/output
  var isDangling = function (node, name) {
    const outlet = node.get(name);

    if (!outlet) {
      const module =
        (node.owner.snippet != null ? node.owner.snippet._name : undefined) !=
        null
          ? node.owner.snippet != null
            ? node.owner.snippet._name
            : undefined
          : node.owner.namespace;
      throw new Error(
        `Unable to link program. Unlinked callback \`${name}\` on \`${module}\``
      );
    }

    if (outlet.inout === IN) {
      return outlet.input === null;
    } else if (outlet.inout === OUT) {
      return outlet.output.length === 0;
    }
  };

  return process();
};

;// CONCATENATED MODULE: ./src/linker/layout.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



const debug = false;

/*
  Program linkage layout

  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
*/
class Layout {
  constructor(language, graph) {
    this.language = language;
    this.graph = graph;
    this.links = [];
    this.includes = [];
    this.modules = {};
    this.visits = {};
  }

  // Link up a given named external to this module's entry point
  callback(node, module, priority, name, external) {
    return this.links.push({ node, module, priority, name, external });
  }

  // Include this module of code
  include(node, module, priority) {
    let m;
    if ((m = this.modules[module.namespace]) != null) {
      return (m.priority = Math.max(priority, m.priority));
    } else {
      this.modules[module.namespace] = true;
      return this.includes.push({ node, module, priority });
    }
  }

  // Visit each namespace at most once to avoid infinite recursion
  visit(namespace) {
    debug && console.log("Visit", namespace, !this.visits[namespace]);
    if (this.visits[namespace]) {
      return false;
    }
    return (this.visits[namespace] = true);
  }

  // Compile queued ops into result
  link(module) {
    const data = link_link(this.language, this.links, this.includes, module);
    const snippet = new Snippet();
    for (let key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  }
}

;// CONCATENATED MODULE: ./src/linker/index.js


const { load } = Snippet;








;// CONCATENATED MODULE: ./src/block/block.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */




let block_debug = false;

class Block {
  static previous(outlet) {
    return outlet.input != null ? outlet.input.node.owner : undefined;
  }

  constructor(delay) {
    // Subclasses can pass `delay` to allow them to initialize before they call
    // `@construct`.
    if (delay == null) {
      delay = false;
    }
    if (!delay) {
      this.construct();
    }
  }

  construct() {
    let left;
    if (this.namespace == null) {
      this.namespace = Program.entry();
    }
    return (this.node = new node_Node(
      this,
      (left =
        typeof this.makeOutlets === "function"
          ? this.makeOutlets()
          : undefined) != null
        ? left
        : {}
    ));
  }

  refresh() {
    let left;
    return this.node.setOutlets(
      (left =
        typeof this.makeOutlets === "function"
          ? this.makeOutlets()
          : undefined) != null
        ? left
        : {}
    );
  }

  clone() {
    return new Block();
  }

  // Compile a new program starting from this block
  compile(language, namespace) {
    const program = new Program(
      language,
      namespace != null ? namespace : Program.entry(),
      this.node.graph
    );
    this.call(program, 0);
    return program.assemble();
  }

  // Link up programs into a layout, starting from this block
  link(language, namespace) {
    const module = this.compile(language, namespace);

    const layout = new Layout(language, this.node.graph);
    this._include(module, layout, 0);
    this.export(layout, 0);
    return layout.link(module);
  }

  // Subclassed methods
  call(_program, _depth) {}
  callback(_layout, _depth, _name, _external, _outlet) {}
  export(_layout, _depth) {}

  // Info string for debugging
  _info(suffix) {
    let string =
      (this.node.owner.snippet != null
        ? this.node.owner.snippet._name
        : undefined) != null
        ? this.node.owner.snippet != null
          ? this.node.owner.snippet._name
          : undefined
        : this.node.owner.namespace;
    if (suffix != null) {
      return (string += "." + suffix);
    }
  }

  // Create an outlet for a signature definition
  _outlet(def, props) {
    const outlet = Outlet.make(def, props);
    outlet.meta.def = def;
    return outlet;
  }

  // Make a call to this module in the given program
  _call(module, program, depth) {
    return program.call(this.node, module, depth);
  }

  // Require this module's dependencies in the given program
  _require(module, program) {
    return program.require(this.node, module);
  }

  // Make a call to all connected inputs
  _inputs(module, program, depth) {
    return (() => {
      const result = [];
      for (let arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(
          __guard__(Block.previous(outlet), (x) => x.call(program, depth + 1))
        );
      }
      return result;
    })();
  }

  // Insert callback to this module in the given layout
  _callback(module, layout, depth, name, external, outlet) {
    return layout.callback(this.node, module, depth, name, external, outlet);
  }

  // Include this module in the given layout
  _include(module, layout, depth) {
    return layout.include(this.node, module, depth);
  }

  // Link this module's connected callbacks
  _link(module, layout, depth) {
    block_debug && console.log("block::_link", this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (let key of Array.from(module.symbols)) {
        const ext = module.externals[key];
        let outlet = this.node.get(ext.name);
        if (!outlet) {
          throw new OutletError(
            `External not found on ${this._info(ext.name)}`
          );
        }

        if (outlet.meta.child != null) {
          continue;
        }

        let parent = outlet;
        let block;
        while (!block && parent) {
          [parent, outlet] = Array.from([outlet.meta.parent, parent]);
        }

        block = Block.previous(outlet);
        if (!block) {
          throw new OutletError(
            `Missing connection on ${this._info(ext.name)}`
          );
        }

        block_debug && console.log("callback -> ", this.toString(), ext.name, outlet);
        block.callback(layout, depth + 1, key, ext, outlet.input);
        result.push(
          block != null ? block.export(layout, depth + 1) : undefined
        );
      }
      return result;
    })();
  }

  // Trace backwards to discover callbacks further up
  _trace(module, layout, depth) {
    block_debug && console.log("block::_trace", this.toString(), module.namespace);
    return (() => {
      const result = [];
      for (let arg of Array.from(module.main.signature)) {
        const outlet = this.node.get(arg.name);
        result.push(
          __guard__(Block.previous(outlet), (x) => x.export(layout, depth + 1))
        );
      }
      return result;
    })();
  }
}

var OutletError = function (message) {
  const e = new Error(message);
  e.name = "OutletError";
  return e;
};

OutletError.prototype = new Error();

function __guard__(value, transform) {
  return typeof value !== "undefined" && value !== null
    ? transform(value)
    : undefined;
}

;// CONCATENATED MODULE: ./src/block/call.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


class Call extends Block {
  constructor(snippet) {
    super(true);

    this.snippet = snippet;
    this.namespace = snippet.namespace;
    this.construct();
  }

  clone() {
    return new Call(this.snippet);
  }

  makeOutlets() {
    const main = this.snippet.main.signature;
    const { externals } = this.snippet;
    const { symbols } = this.snippet;

    const params = Array.from(main).map((outlet) =>
      this._outlet(outlet, { callback: false })
    );
    const callbacks = Array.from(symbols).map((key) =>
      this._outlet(externals[key], { callback: true })
    );

    return params.concat(callbacks);
  }

  call(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }

    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  }
}

;// CONCATENATED MODULE: ./src/block/callback.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
  Re-use a subgraph as a callback
*/
class Callback extends Block {
  constructor(graph) {
    super(true);
    this.graph = graph;
    this.construct();
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Callback(this.graph);
  }

  makeOutlets() {
    let outlet;
    this.make();

    const outlets = [];
    let ins = [];
    let outs = [];

    // Pass-through existing callbacks
    // Collect open inputs/outputs
    const handle = (outlet, list) => {
      if (outlet.meta.callback) {
        if (outlet.inout === Graph.IN) {
          // Dupe outlet and create two-way link between cloned outlets
          const dupe = outlet.dupe();
          if (dupe.meta.child == null) {
            dupe.meta.child = outlet;
          }
          outlet.meta.parent = dupe;

          return outlets.push(dupe);
        }
      } else {
        return list.push(outlet.type);
      }
    };

    for (outlet of Array.from(this.graph.inputs())) {
      handle(outlet, ins);
    }
    for (outlet of Array.from(this.graph.outputs())) {
      handle(outlet, outs);
    }

    // Merge inputs/outputs into new callback signature
    ins = ins.join(",");
    outs = outs.join(",");
    const type = `(${ins})(${outs})`;

    outlets.push({
      name: "callback",
      type,
      inout: Graph.OUT,
      meta: {
        callback: true,
        def: this.subroutine.main,
      },
    });

    return outlets;
  }

  make() {
    return (this.subroutine = this.graph.compile(this.namespace));
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }

    this._link(this.subroutine, layout, depth);
    return this.graph.export(layout, depth);
  }

  call(program, depth) {
    return this._require(this.subroutine, program, depth);
  }

  callback(layout, depth, name, external, outlet) {
    this._include(this.subroutine, layout, depth);
    return this._callback(
      this.subroutine,
      layout,
      depth,
      name,
      external,
      outlet
    );
  }
}

;// CONCATENATED MODULE: ./src/block/isolate.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



/*
  Isolate a subgraph as a single node
*/
class Isolate extends Block {
  constructor(graph) {
    super(true);
    this.graph = graph;
    this.construct();
  }

  refresh() {
    super.refresh();
    return delete this.subroutine;
  }

  clone() {
    return new Isolate(this.graph);
  }

  makeOutlets() {
    this.make();

    const outlets = [];

    const seen = {};
    const done = {};
    for (let set of ["inputs", "outputs"]) {
      for (let outlet of Array.from(this.graph[set]())) {
        // Preserve name of 'return' and 'callback' outlets
        let name = undefined;
        if (
          ["return", "callback"].includes(outlet.hint) &&
          outlet.inout === Graph.OUT
        ) {
          name = outlet.hint;
        }

        // Unless it already exists
        if (seen[name] != null) {
          name = undefined;
        }

        // Dupe outlet and remember link to original
        const dupe = outlet.dupe(name);
        if (dupe.meta.child == null) {
          dupe.meta.child = outlet;
        }
        outlet.meta.parent = dupe;
        if (name != null) {
          seen[name] = true;
        }
        done[outlet.name] = dupe;

        outlets.push(dupe);
      }
    }

    return outlets;
  }

  make() {
    return (this.subroutine = this.graph.compile(this.namespace));
  }

  call(program, depth) {
    this._call(this.subroutine, program, depth);
    return this._inputs(this.subroutine, program, depth);
  }

  export(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }

    // Link up with normal inputs
    this._link(this.subroutine, layout, depth);
    this._trace(this.subroutine, layout, depth);

    // Export callbacks needed to call the subroutine
    return this.graph.export(layout, depth);
  }

  callback(layout, depth, name, external, outlet) {
    outlet = outlet.meta.child;
    return outlet.node.owner.callback(layout, depth, name, external, outlet);
  }
}

;// CONCATENATED MODULE: ./src/block/join.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


/*
  Join multiple disconnected nodes
*/
class Join extends Block {
  constructor(nodes) {
    super(true);
    this.nodes = nodes;
    this.construct();
  }

  clone() {
    return new Join(this.nodes);
  }

  makeOutlets() {
    return [];
  }

  call(program, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.call(program, depth));
      }
      return result;
    })();
  }

  export(layout, depth) {
    return (() => {
      const result = [];
      for (let node of Array.from(this.nodes)) {
        const block = node.owner;
        result.push(block.export(layout, depth));
      }
      return result;
    })();
  }
}

;// CONCATENATED MODULE: ./src/block/index.js






;// CONCATENATED MODULE: ./src/visualize/serialize.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Dump graph for debug/visualization purposes


const isCallback = (outlet) => outlet.type[0] === "(";

var serialize = function (graph) {
  const nodes = [];
  const links = [];

  for (let node of Array.from(graph.nodes)) {
    var outlet;
    const record = {
      // Data
      id: node.id,
      name: null,
      type: null,
      depth: null,
      graph: null,
      inputs: [],
      outputs: [],
    };

    nodes.push(record);

    const { inputs } = record;
    const { outputs } = record;

    const block = node.owner;

    if (block instanceof Call) {
      record.name = block.snippet._name;
      record.type = "call";
      record.code = block.snippet._original;
    } else if (block instanceof Callback) {
      record.name = "Callback";
      record.type = "callback";
      record.graph = serialize(block.graph);
    } else if (block instanceof Isolate) {
      record.name = "Isolate";
      record.type = "isolate";
      record.graph = serialize(block.graph);
    } else if (block instanceof Join) {
      record.name = "Join";
      record.type = "join";
    } else if (block != null) {
      if (record.name == null) {
        record.name = block.name != null ? block.name : block.type;
      }
      if (record.type == null) {
        record.type = block.type;
      }
      if (record.code == null) {
        record.code = block.code;
      }
      if (block.graph != null) {
        record.graph = serialize(block.graph);
      }
    }

    const format = function (type) {
      type = type.replace(")(", ")→(");
      return (type = type.replace("()", ""));
    };

    for (outlet of Array.from(node.inputs)) {
      inputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: outlet.input == null,
      });
    }

    for (outlet of Array.from(node.outputs)) {
      outputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: !outlet.output.length,
      });

      for (let other of Array.from(outlet.output)) {
        links.push({
          from: node.id,
          out: outlet.id,
          to: other.node.id,
          in: other.id,
          type: format(outlet.type),
        });
      }
    }
  }

  return { nodes, links };
};

;// CONCATENATED MODULE: ./src/factory/hash.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Hash string into a 32-bit key (murmurhash3)
const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const c3 = 0xe6546b64;
const c4 = 0x85ebca6b;
const c5 = 0xc2b2ae35;

// Fix imul in old/broken browsers
let imul = function (a, b) {
  const ah = (a >>> 16) & 0xffff;
  const al = a & 0xffff;
  const bh = (b >>> 16) & 0xffff;
  const bl = b & 0xffff;
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
};

if (Math.imul != null) {
  const test = Math.imul(0xffffffff, 5);
  if (test === -5) {
    ({ imul } = Math);
  }
}

const hash = function (string) {
  let h;
  const n = string.length;
  let m = Math.floor(n / 2);
  let j = (h = 0);

  const next = () => string.charCodeAt(j++);
  const iterate = function (a, b) {
    let k = a | (b << 16); // two utf-16 words
    k ^= k << 9; // whitening for ascii-only strings

    k = imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = imul(k, c2);

    h ^= k;

    h = (h << 13) | (h >>> 19);
    h = imul(h, 5);
    return (h = (h + c3) | 0);
  };

  while (m--) {
    iterate(next(), next());
  }
  if (n & 1) {
    iterate(next(), 0);
  }

  h ^= n;
  h ^= h >>> 16;
  h = imul(h, c4);
  h ^= h >>> 13;
  h = imul(h, c5);

  return (h ^= h >>> 16);
};

;// CONCATENATED MODULE: ./src/visualize/markup.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


const trim = (string) => ("" + string).replace(/^\s+|\s+$/g, "");

const cssColor = (r, g, b, alpha) =>
  "rgba(" + [r, g, b, alpha].join(", ") + ")";

const hashColor = function (string, alpha) {
  if (alpha == null) {
    alpha = 1;
  }
  const color = hash(string) ^ 0x123456;

  let r = color & 0xff;
  let g = (color >>> 8) & 0xff;
  let b = (color >>> 16) & 0xff;

  const max = Math.max(r, g, b);
  const norm = 140 / max;
  const min = Math.round(max / 3);

  r = Math.min(255, Math.round(norm * Math.max(r, min)));
  g = Math.min(255, Math.round(norm * Math.max(g, min)));
  b = Math.min(255, Math.round(norm * Math.max(b, min)));

  return cssColor(r, g, b, alpha);
};

const escapeText = function (string) {
  string = string != null ? string : "";
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
};

const process = function (data) {
  const links = [];
  const el = _markup(data, links);
  el.update = () => connect(el, links);
  _activate(el);
  return el;
};

var _activate = function (el) {
  const codes = el.querySelectorAll(".shadergraph-code");
  return Array.from(codes).map((code) =>
    (function () {
      const popup = code;
      popup.parentNode.classList.add("shadergraph-has-code");
      return popup.parentNode.addEventListener(
        "click",
        (event) =>
          (popup.style.display = {
            block: "none",
            none: "block",
          }[popup.style.display || "none"])
      );
    })()
  );
};

const _order = function (data) {
  let link, node;
  const nodeMap = {};
  const linkMap = {};
  for (node of Array.from(data.nodes)) {
    nodeMap[node.id] = node;
  }

  for (link of Array.from(data.links)) {
    if (linkMap[link.from] == null) {
      linkMap[link.from] = [];
    }
    linkMap[link.from].push(link);
  }

  var recurse = function (node, depth) {
    let next;
    if (depth == null) {
      depth = 0;
    }
    node.depth = Math.max(node.depth != null ? node.depth : 0, depth);
    if ((next = linkMap[node.id])) {
      for (link of Array.from(next)) {
        recurse(nodeMap[link.to], depth + 1);
      }
    }
    return null;
  };

  for (node of Array.from(data.nodes)) {
    if (node.depth == null) {
      recurse(node);
    }
  }

  return null;
};

var _markup = function (data, links) {
  let column;
  _order(data);

  const wrapper = document.createElement("div");
  wrapper.classList.add("shadergraph-graph");

  const columns = [];
  const outlets = {};

  for (let node of Array.from(data.nodes)) {
    var outlet;
    var block = document.createElement("div");
    block.classList.add("shadergraph-node");
    block.classList.add(`shadergraph-node-${node.type}`);

    block.innerHTML = `\
<div class="shadergraph-header">${escapeText(node.name)}</div>\
`;

    const addOutlet = function (outlet, inout) {
      const color = hashColor(outlet.type);

      const div = document.createElement("div");
      div.classList.add("shadergraph-outlet");
      div.classList.add(`shadergraph-outlet-${inout}`);
      div.innerHTML = `\
<div class="shadergraph-point" style="background: ${color}"></div>
<div class="shadergraph-type" style="color: ${color}">${escapeText(
        outlet.type
      )}</div>
<div class="shadergraph-name">${escapeText(outlet.name)}</div>\
`;
      block.appendChild(div);

      return (outlets[outlet.id] = div.querySelector(".shadergraph-point"));
    };

    for (outlet of Array.from(node.inputs)) {
      addOutlet(outlet, "in");
    }
    for (outlet of Array.from(node.outputs)) {
      addOutlet(outlet, "out");
    }

    if (node.graph != null) {
      block.appendChild(_markup(node.graph, links));
    } else {
      const clear = document.createElement("div");
      clear.classList.add("shadergraph-clear");
      block.appendChild(clear);
    }

    if (node.code != null) {
      const div = document.createElement("div");
      div.classList.add("shadergraph-code");
      div.innerHTML = escapeText(trim(node.code));
      block.appendChild(div);
    }

    column = columns[node.depth];
    if (column == null) {
      column = document.createElement("div");
      column.classList.add("shadergraph-column");
      columns[node.depth] = column;
    }
    column.appendChild(block);
  }

  for (column of Array.from(columns)) {
    if (column != null) {
      wrapper.appendChild(column);
    }
  }

  for (let link of Array.from(data.links)) {
    const color = hashColor(link.type);

    links.push({
      color,
      out: outlets[link.out],
      in: outlets[link.in],
    });
  }

  return wrapper;
};

const sqr = (x) => x * x;

const path = function (x1, y1, x2, y2) {
  let h;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(sqr(dx) + sqr(dy));

  const vert = Math.abs(dy) > Math.abs(dx);
  if (vert) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const f = dy > 0 ? 0.3 : -0.3;
    h = Math.min(Math.abs(dx) / 2, 20 + d / 8);

    return [
      "M",
      x1,
      y1,
      "C",
      x1 + h,
      y1 + ",",
      mx,
      my - d * f,
      mx,
      my,
      "C",
      mx,
      my + d * f,
      x2 - h,
      y2 + ",",
      x2,
      y2,
    ].join(" ");
  } else {
    h = Math.min(Math.abs(dx) / 2.5, 20 + d / 4);

    return ["M", x1, y1, "C", x1 + h, y1 + ",", x2 - h, y2 + ",", x2, y2].join(
      " "
    );
  }
};

const makeSVG = function (tag) {
  if (tag == null) {
    tag = "svg";
  }
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
};

var connect = function (element, links) {
  let link;
  if (element.parentNode == null) {
    return;
  }

  const ref = element.getBoundingClientRect();

  for (link of Array.from(links)) {
    const a = link.out.getBoundingClientRect();
    const b = link.in.getBoundingClientRect();

    link.coords = {
      x1: (a.left + a.right) / 2 - ref.left,
      y1: (a.top + a.bottom) / 2 - ref.top,
      x2: (b.left + b.right) / 2 - ref.left,
      y2: (b.top + b.bottom) / 2 - ref.top,
    };
  }

  let svg = element.querySelector("svg");
  if (svg != null) {
    element.removeChild(svg);
  }

  let box = element;
  while (box.parentNode && box.offsetHeight === 0) {
    box = box.parentNode;
  }

  svg = makeSVG();
  svg.setAttribute("width", box.offsetWidth);
  svg.setAttribute("height", box.offsetHeight);

  for (link of Array.from(links)) {
    const c = link.coords;

    const line = makeSVG("path");
    line.setAttribute("d", path(c.x1, c.y1, c.x2, c.y2));
    line.setAttribute("stroke", link.color);
    line.setAttribute("stroke-width", 3);
    line.setAttribute("fill", "transparent");
    svg.appendChild(line);
  }

  return element.appendChild(svg);
};

const overlay = function (contents) {
  const div = document.createElement("div");
  div.setAttribute("class", "shadergraph-overlay");

  const close = document.createElement("div");
  close.setAttribute("class", "shadergraph-close");
  close.innerHTML = "&times;";

  const view = document.createElement("div");
  view.setAttribute("class", "shadergraph-view");

  const inside = document.createElement("div");
  inside.setAttribute("class", "shadergraph-inside");

  inside.appendChild(contents);
  view.appendChild(inside);
  div.appendChild(view);
  div.appendChild(close);

  close.addEventListener("click", () => div.parentNode.removeChild(div));

  return div;
};

const wrap = function (markup) {
  if (markup instanceof Node) {
    return markup;
  }
  const p = document.createElement("span");
  p.innerText = markup != null ? markup : "";
  return p;
};

const merge = function (markup) {
  if (markup.length !== 1) {
    let el;
    const div = document.createElement("div");
    for (el of Array.from(markup)) {
      div.appendChild(wrap(el));
    }
    div.update = () =>
      (() => {
        const result = [];
        for (el of Array.from(markup)) {
          result.push(
            typeof el.update === "function" ? el.update() : undefined
          );
        }
        return result;
      })();
    return div;
  } else {
    return wrap(markup[0]);
  }
};

;// CONCATENATED MODULE: ./src/visualize/index.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */




const visualize_serialize = serialize;
const markup = markup_namespaceObject;

const _visualize = function (graph) {
  if (!graph) {
    return;
  }
  if (!graph.nodes) {
    return graph;
  }

  const data = visualize_serialize(graph);
  return markup.process(data);
};

var resolve = function (arg) {
  if (arg == null) {
    return arg;
  }
  if (arg instanceof Array) {
    return arg.map(resolve);
  }
  if (arg.vertex != null && arg.fragment != null) {
    return [resolve(arg.vertex, resolve(arg.fragment))];
  }
  if (arg._graph != null) {
    return arg._graph;
  }
  if (arg.graph != null) {
    return arg.graph;
  }
  return arg;
};

var visualize_merge = function (args) {
  let out = [];
  for (let arg of Array.from(args)) {
    if (arg instanceof Array) {
      out = out.concat(visualize_merge(arg));
    } else if (arg != null) {
      out.push(arg);
    }
  }
  return out;
};

const visualize = function () {
  const list = visualize_merge(resolve([].slice.call(arguments)));
  return markup.merge(
    Array.from(list)
      .filter((graph) => graph)
      .map((graph) => _visualize(graph))
  );
};

const inspect = function () {
  const contents = visualize.apply(null, arguments);
  const element = markup.overlay(contents);

  for (let el of Array.from(
    document.querySelectorAll(".shadergraph-overlay")
  )) {
    el.remove();
  }
  document.body.appendChild(element);
  contents.update();

  return element;
};

;// CONCATENATED MODULE: ./src/factory/factory.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */




/*
  Chainable factory

  Exposes methods to build a graph incrementally
*/
class Factory {
  constructor(language, fetch, config) {
    this.language = language;
    this.fetch = fetch;
    this.config = config;
    this.graph();
  }

  // Combined call/concat shortcut
  pipe(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._concat(name);
    } else if (name != null) {
      this._call(name, uniforms, namespace, defines);
    }
    return this;
  }

  // Old name
  call(name, uniforms, namespace, defines) {
    return this.pipe(name, uniforms, namespace, defines);
  }

  // Combined callback/import shortcut
  require(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._import(name);
    } else if (name != null) {
      this.callback();
      this._call(name, uniforms, namespace, defines);
      this.end();
    }
    return this;
  }

  // Old name
  import(name, uniforms, namespace, defines) {
    return this.require(name, uniforms, namespace, defines);
  }

  // Create parallel branches that connect as one block to the end
  // (one outgoing connection per outlet)
  split() {
    this._group("_combine", true);
    return this;
  }

  // Create parallel branches that fan out from the end
  // (multiple outgoing connections per outlet)
  fan() {
    this._group("_combine", false);
    return this;
  }

  // Create isolated subgraph
  isolate() {
    this._group("_isolate");
    return this;
  }

  // Create callback subgraph
  callback() {
    this._group("_callback");
    return this;
  }

  // Next branch in group
  next() {
    this._next();
    return this;
  }

  // Connect branches to previous tail and add pass-through from end
  pass() {
    const pass = this._stack[2].end;
    this.end();
    this._state.end = this._state.end.concat(pass);
    return this;
  }

  // Leave nested branches and join up with main graph,
  // applying stored op along the way
  end() {
    const [sub, main] = Array.from(this._exit());
    const { op } = sub;
    if (this[op]) {
      this[op](sub, main);
    }
    return this;
  }

  // Old name
  join() {
    return this.end();
  }

  // Return finalized graph / reset factory
  graph() {
    // Pop remaining stack
    while ((this._stack != null ? this._stack.length : undefined) > 1) {
      this.end();
    }

    // Remember terminating node(s) of graph
    if (this._graph) {
      this._tail(this._state, this._graph);
    }

    const graph = this._graph;

    this._graph = new Graph();
    this._state = new State();
    this._stack = [this._state];

    return graph;
  }

  // Compile shortcut (graph is thrown away)
  compile(namespace) {
    if (namespace == null) {
      namespace = "main";
    }
    return this.graph().compile(namespace);
  }

  // Link shortcut (graph is thrown away)
  link(namespace) {
    if (namespace == null) {
      namespace = "main";
    }
    return this.graph().link(namespace);
  }

  // Serialize for debug
  serialize() {
    return visualize_serialize(this._graph);
  }

  // Return true if empty
  empty() {
    return this._graph.nodes.length === 0;
  }

  // Concatenate existing factory onto tail
  // Retains original factory
  _concat(factory) {
    // Ignore empty concat
    let block;
    if (factory._state.nodes.length === 0) {
      return this;
    }

    this._tail(factory._state, factory._graph);

    try {
      block = new Isolate(factory._graph);
    } catch (error) {
      if (this.config.autoInspect) {
        inspect(error, this._graph, factory);
      }
      throw error;
    }

    this._auto(block);
    return this;
  }

  // Add existing factory as callback
  // Retains original factory
  _import(factory) {
    // Check for empty require
    let block;
    if (factory._state.nodes.length === 0) {
      throw "Can't import empty callback";
    }

    this._tail(factory._state, factory._graph);

    try {
      block = new Callback(factory._graph);
    } catch (error) {
      if (this.config.autoInspect) {
        inspect(error, this._graph, factory);
      }
      throw error;
    }

    this._auto(block);
    return this;
  }

  // Connect parallel branches to tail
  _combine(sub, main) {
    for (let to of Array.from(sub.start)) {
      for (let from of Array.from(main.end)) {
        from.connect(to, sub.multi);
      }
    }

    main.end = sub.end;
    return (main.nodes = main.nodes.concat(sub.nodes));
  }

  // Make subgraph and connect to tail
  _isolate(sub, main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Isolate(subgraph);
      } catch (error) {
        if (this.config.autoInspect) {
          inspect(error, this._graph, subgraph);
        }
        throw error;
      }

      return this._auto(block);
    }
  }

  // Convert to callback and connect to tail
  _callback(sub, main) {
    if (sub.nodes.length) {
      let block;
      const subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);

      try {
        block = new Callback(subgraph);
      } catch (error) {
        if (this.config.autoInspect) {
          inspect(error, this._graph, subgraph);
        }
        throw error;
      }

      return this._auto(block);
    }
  }

  // Create next call block
  _call(name, uniforms, namespace, defines) {
    const snippet = this.fetch(name);
    snippet.bind(this.config, uniforms, namespace, defines);
    const block = new Call(snippet);
    return this._auto(block);
  }

  // Move current state into subgraph
  _subgraph(sub) {
    const subgraph = new Graph(null, this._graph);
    subgraph.adopt(sub.nodes);
    return subgraph;
  }

  // Finalize graph tail
  _tail(state, graph) {
    // Merge (unique) terminating ends into single tail node if needed
    let tail = state.end.concat(state.tail);
    tail = tail.filter((node, i) => tail.indexOf(node) === i);

    if (tail.length > 1) {
      tail = new Join(tail);
      tail = [tail.node];
      this._graph.add(tail);
    }

    // Save single endpoint
    graph.tail = tail[0];
    state.end = tail;
    state.tail = [];

    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }

    // Add compile/link/export/inspect shortcut methods
    graph.compile = (namespace) => {
      if (namespace == null) {
        namespace = "main";
      }
      try {
        return graph.tail.owner.compile(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };

    graph.link = (namespace) => {
      if (namespace == null) {
        namespace = "main";
      }
      try {
        return graph.tail.owner.link(this.language, namespace);
      } catch (error) {
        if (this.config.autoInspect) {
          graph.inspect(error);
        }
        throw error;
      }
    };

    graph.export = (layout, depth) => {
      return graph.tail.owner.export(layout, depth);
    };

    return (graph.inspect = (message = null) =>
      inspect(message, graph));
  }

  // Create group for branches or callbacks
  _group(op, multi) {
    this._push(op, multi); // Accumulator
    this._push(); // Current
    return this;
  }

  // Merge branch into accumulator and reset state
  _next() {
    const sub = this._pop();

    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    this._state.tail = this._state.tail.concat(sub.tail);

    return this._push();
  }

  // Exit nested branches
  _exit() {
    this._next();
    this._pop();
    return [this._pop(), this._state];
  }

  // State stack
  _push(op, multi) {
    this._stack.unshift(new State(op, multi));
    return (this._state = this._stack[0]);
  }

  _pop() {
    let left;
    this._state = this._stack[1];
    if (this._state == null) {
      this._state = new State();
    }
    return (left = this._stack.shift()) != null ? left : new State();
  }

  // Auto append or insert depending on whether we have inputs
  _auto(block) {
    if (block.node.inputs.length) {
      return this._append(block);
    } else {
      return this._insert(block);
    }
  }

  // Add block and connect to end
  _append(block) {
    let end;
    const { node } = block;
    this._graph.add(node);

    for (end of Array.from(this._state.end)) {
      end.connect(node);
    }

    if (!this._state.start.length) {
      this._state.start = [node];
    }
    this._state.end = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      this._state.tail.push(node);
    }
  }

  // Add block and connect to start
  _prepend(block) {
    let start;
    const { node } = block;
    this._graph.add(node);

    for (start of Array.from(this._state.start)) {
      node.connect(start);
    }

    if (!this._state.end.length) {
      this._state.end = [node];
    }
    this._state.start = [node];

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      this._state.tail.push(node);
    }
  }

  // Insert loose block
  _insert(block) {
    const { node } = block;
    this._graph.add(node);

    this._state.start.push(node);
    this._state.end.push(node);

    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  }
}

class State {
  constructor(op = null, multi, start, end, nodes, tail) {
    this.op = op;
    if (multi == null) {
      multi = false;
    }
    this.multi = multi;
    if (start == null) {
      start = [];
    }
    this.start = start;
    if (end == null) {
      end = [];
    }
    this.end = end;
    if (nodes == null) {
      nodes = [];
    }
    this.nodes = nodes;
    if (tail == null) {
      tail = [];
    }
    this.tail = tail;
  }
}

;// CONCATENATED MODULE: ./src/factory/material.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */



let material_debug = false;

const tick = function () {
  const now = +new Date();
  return function (label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

class Material {
  constructor(vertex, fragment) {
    this.vertex = vertex;
    this.fragment = fragment;
    if (material_debug) {
      this.tock = tick();
    }
  }

  build(options) {
    return this.link(options);
  }

  link(options) {
    if (options == null) {
      options = {};
    }
    const uniforms = {};
    const varyings = {};
    const attributes = {};

    const vertex = this.vertex.link("main");
    const fragment = this.fragment.link("main");

    for (let shader of [vertex, fragment]) {
      var key, value;
      for (key in shader.uniforms) {
        value = shader.uniforms[key];
        uniforms[key] = value;
      }
      for (key in shader.varyings) {
        value = shader.varyings[key];
        varyings[key] = value;
      }
      for (key in shader.attributes) {
        value = shader.attributes[key];
        attributes[key] = value;
      }
    }

    options.vertexShader = vertex.code;
    options.vertexGraph = vertex.graph;
    options.fragmentShader = fragment.code;
    options.fragmentGraph = fragment.graph;
    options.attributes = attributes;
    options.uniforms = uniforms;
    options.varyings = varyings;
    options.inspect = () =>
      inspect(
        "Vertex Shader",
        vertex,
        "Fragment Shader",
        fragment.graph
      );

    if (material_debug) {
      this.tock("Material build");
    }

    return options;
  }

  inspect() {
    return inspect(
      "Vertex Shader",
      this.vertex,
      "Fragment Shader",
      this.fragment.graph
    );
  }
}

;// CONCATENATED MODULE: ./src/factory/library.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Snippet library

  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, only pass in inline source code

  If 'name' contains any of "{;(#" it is assumed to be direct GLSL code.
*/
const library = function (language, snippets, load) {
  let callback = null;
  let used = {};

  if (snippets != null) {
    if (typeof snippets === "function") {
      callback = (name) => load(language, name, snippets(name));
    } else if (typeof snippets === "object") {
      callback = function (name) {
        if (snippets[name] == null) {
          throw new Error(`Unknown snippet \`${name}\``);
        }
        return load(language, name, snippets[name]);
      };
    }
  }

  const inline = (code) => load(language, "", code);

  if (callback == null) {
    return inline;
  }

  const fetch = function (name) {
    if (name.match(/[{;]/)) {
      return inline(name);
    }
    used[name] = true;
    return callback(name);
  };

  fetch.used = function (_used) {
    if (_used == null) {
      _used = used;
    }
    return (used = _used);
  };

  return fetch;
};

;// CONCATENATED MODULE: ./src/factory/queue.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Least-recently-used queue for key expiry via linked list
const queue = function (limit) {
  if (limit == null) {
    limit = 100;
  }
  const map = {};

  let head = null;
  let tail = null;
  let count = 0;

  // Insert at front
  const add = function (item) {
    item.prev = null;
    item.next = head;

    if (head != null) {
      head.prev = item;
    }

    head = item;
    if (tail == null) {
      return (tail = item);
    }
  };

  // Remove from list
  const remove = function (item) {
    const { prev } = item;
    const { next } = item;

    if (prev != null) {
      prev.next = next;
    }
    if (next != null) {
      next.prev = prev;
    }

    if (head === item) {
      head = next;
    }
    if (tail === item) {
      return (tail = prev);
    }
  };

  // Push key to top of list
  return function (key) {
    let dead, item;
    if ((item = map[key]) && item !== head) {
      // Already in queue
      remove(item);
      add(item);
    } else {
      // Check capacity
      if (count === limit) {
        // Pop tail
        dead = tail.key;
        remove(tail);

        // Expire key
        delete map[dead];
      } else {
        count++;
      }

      // Replace head
      item = { next: head, prev: null, key };
      add(item);

      // Map record for lookup
      map[key] = item;
    }

    // Return expired key
    return dead;
  };
};

;// CONCATENATED MODULE: ./src/factory/cache.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Cache decorator
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
*/



const cache = function (fetch) {
  const cached = {};
  const push = queue(100);

  // Snippet factory
  return function (name) {
    const key = name.length > 32 ? "##" + hash(name).toString(16) : name;

    // Push new key onto queue, see if an old key expired
    const expire = push(key);
    if (expire != null) {
      delete cached[expire];
    }

    // Clone cached snippet
    if (cached[key] == null) {
      cached[key] = fetch(name);
    }
    return cached[key].clone();
  };
};

;// CONCATENATED MODULE: ./src/factory/index.js








;// CONCATENATED MODULE: ./src/glsl/compile.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
*/

const compile = function (program) {
  const { ast, code, signatures } = program;

  // Prepare list of placeholders
  const placeholders = replaced(signatures);

  // Compile
  const assembler = string_compiler(code, placeholders);

  return [signatures, assembler];
};

// #####

const compile_tick = function () {
  const now = +new Date();
  return function (label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

var replaced = function (signatures) {
  const out = {};
  const s = (sig) => (out[sig.name] = true);

  s(signatures.main);

  // Prefix all global symbols
  for (let key of ["external", "internal", "varying", "uniform", "attribute"]) {
    for (let sig of signatures[key]) {
      s(sig);
    }
  }

  return out;
};

/*
String-replacement based compiler
*/
var string_compiler = function (code, placeholders) {
  // Make regexp for finding placeholders
  // Replace on word boundaries
  let key;
  const re = new RegExp(
    "\\b(" +
      (() => {
        const result = [];
        for (key in placeholders) {
          result.push(key);
        }
        return result;
      })().join("|") +
      ")\\b",
    "g"
  );

  // Strip comments
  code = code.replace(/\/\/[^\n]*/g, "");
  code = code.replace(/\/\*([^*]|\*[^\/])*\*\//g, "");

  // Strip all preprocessor commands (lazy)
  //code = code.replace /^#[^\n]*/mg, ''

  // Assembler function that takes namespace prefix and exceptions
  // and returns GLSL source code
  return function (prefix, exceptions, defines) {
    let key;
    if (prefix == null) {
      prefix = "";
    }
    if (exceptions == null) {
      exceptions = {};
    }
    if (defines == null) {
      defines = {};
    }
    const replace = {};
    for (key in placeholders) {
      replace[key] = exceptions[key] != null ? key : prefix + key;
    }

    const compiled = code.replace(re, (key) => replace[key]);

    const defs = (() => {
      const result1 = [];
      for (key in defines) {
        const value = defines[key];
        result1.push(`#define ${key} ${value}`);
      }
      return result1;
    })();
    if (defs.length) {
      defs.push("");
    }
    return defs.join("\n") + compiled;
  };
};

// EXTERNAL MODULE: ./node_modules/glsl-tokenizer/string.js
var string = __webpack_require__(932);
var string_default = /*#__PURE__*/__webpack_require__.n(string);
// EXTERNAL MODULE: ./node_modules/glsl-parser/direct.js
var direct = __webpack_require__(706);
var direct_default = /*#__PURE__*/__webpack_require__.n(direct);
;// CONCATENATED MODULE: ./node_modules/three/src/math/Vector2.js
class Vector2 {

	constructor( x = 0, y = 0 ) {

		this.x = x;
		this.y = y;

	}

	get width() {

		return this.x;

	}

	set width( value ) {

		this.x = value;

	}

	get height() {

		return this.y;

	}

	set height( value ) {

		this.y = value;

	}

	set( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	}

	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;

		return this;

	}

	setX( x ) {

		this.x = x;

		return this;

	}

	setY( y ) {

		this.y = y;

		return this;

	}

	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	clone() {

		return new this.constructor( this.x, this.y );

	}

	copy( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	}

	add( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;

		return this;

	}

	addScalar( s ) {

		this.x += s;
		this.y += s;

		return this;

	}

	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	}

	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;

		return this;

	}

	sub( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;

		return this;

	}

	subScalar( s ) {

		this.x -= s;
		this.y -= s;

		return this;

	}

	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	}

	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	}

	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;

		return this;

	}

	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	}

	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	applyMatrix3( m ) {

		const x = this.x, y = this.y;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

		return this;

	}

	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );

		return this;

	}

	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );

		return this;

	}

	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );

		return this;

	}

	clampScalar( minVal, maxVal ) {

		this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
		this.y = Math.max( minVal, Math.min( maxVal, this.y ) );

		return this;

	}

	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	}

	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	}

	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	}

	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	}

	roundToZero() {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

		return this;

	}

	negate() {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	}

	dot( v ) {

		return this.x * v.x + this.y * v.y;

	}

	cross( v ) {

		return this.x * v.y - this.y * v.x;

	}

	lengthSq() {

		return this.x * this.x + this.y * this.y;

	}

	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	}

	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y );

	}

	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	angle() {

		// computes the angle in radians with respect to the positive x-axis

		const angle = Math.atan2( - this.y, - this.x ) + Math.PI;

		return angle;

	}

	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	}

	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

	}

	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	}

	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;

		return this;

	}

	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	}

	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	}

	fromBufferAttribute( attribute, index, offset ) {

		if ( offset !== undefined ) {

			console.warn( 'THREE.Vector2: offset has been removed from .fromBufferAttribute().' );

		}

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );

		return this;

	}

	rotateAround( center, angle ) {

		const c = Math.cos( angle ), s = Math.sin( angle );

		const x = this.x - center.x;
		const y = this.y - center.y;

		this.x = x * c - y * s + center.x;
		this.y = x * s + y * c + center.y;

		return this;

	}

	random() {

		this.x = Math.random();
		this.y = Math.random();

		return this;

	}

}

Vector2.prototype.isVector2 = true;



;// CONCATENATED MODULE: ./node_modules/three/src/math/MathUtils.js
const _lut = [];

for ( let i = 0; i < 256; i ++ ) {

	_lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

}

let _seed = 1234567;


const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
function generateUUID() {

	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	const uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
			_lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
			_lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
			_lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

	// .toUpperCase() here flattens concatenated strings to save heap memory space.
	return uuid.toUpperCase();

}

function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

// compute euclidian modulo of m % n
// https://en.wikipedia.org/wiki/Modulo_operation
function euclideanModulo( n, m ) {

	return ( ( n % m ) + m ) % m;

}

// Linear mapping from range <a1, a2> to range <b1, b2>
function mapLinear( x, a1, a2, b1, b2 ) {

	return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

}

// https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/inverse-lerp-a-super-useful-yet-often-overlooked-function-r5230/
function inverseLerp( x, y, value ) {

	if ( x !== y ) {

		return ( value - x ) / ( y - x );

		 } else {

		return 0;

		 }

}

// https://en.wikipedia.org/wiki/Linear_interpolation
function lerp( x, y, t ) {

	return ( 1 - t ) * x + t * y;

}

// http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
function damp( x, y, lambda, dt ) {

	return lerp( x, y, 1 - Math.exp( - lambda * dt ) );

}

// https://www.desmos.com/calculator/vcsjnyz7x4
function pingpong( x, length = 1 ) {

	return length - Math.abs( euclideanModulo( x, length * 2 ) - length );

}

// http://en.wikipedia.org/wiki/Smoothstep
function smoothstep( x, min, max ) {

	if ( x <= min ) return 0;
	if ( x >= max ) return 1;

	x = ( x - min ) / ( max - min );

	return x * x * ( 3 - 2 * x );

}

function smootherstep( x, min, max ) {

	if ( x <= min ) return 0;
	if ( x >= max ) return 1;

	x = ( x - min ) / ( max - min );

	return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

}

// Random integer from <low, high> interval
function randInt( low, high ) {

	return low + Math.floor( Math.random() * ( high - low + 1 ) );

}

// Random float from <low, high> interval
function randFloat( low, high ) {

	return low + Math.random() * ( high - low );

}

// Random float from <-range/2, range/2> interval
function randFloatSpread( range ) {

	return range * ( 0.5 - Math.random() );

}

// Deterministic pseudo-random float in the interval [ 0, 1 ]
function seededRandom( s ) {

	if ( s !== undefined ) _seed = s % 2147483647;

	// Park-Miller algorithm

	_seed = _seed * 16807 % 2147483647;

	return ( _seed - 1 ) / 2147483646;

}

function degToRad( degrees ) {

	return degrees * DEG2RAD;

}

function radToDeg( radians ) {

	return radians * RAD2DEG;

}

function isPowerOfTwo( value ) {

	return ( value & ( value - 1 ) ) === 0 && value !== 0;

}

function ceilPowerOfTwo( value ) {

	return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

}

function floorPowerOfTwo( value ) {

	return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

}

function setQuaternionFromProperEuler( q, a, b, c, order ) {

	// Intrinsic Proper Euler Angles - see https://en.wikipedia.org/wiki/Euler_angles

	// rotations are applied to the axes in the order specified by 'order'
	// rotation by angle 'a' is applied first, then by angle 'b', then by angle 'c'
	// angles are in radians

	const cos = Math.cos;
	const sin = Math.sin;

	const c2 = cos( b / 2 );
	const s2 = sin( b / 2 );

	const c13 = cos( ( a + c ) / 2 );
	const s13 = sin( ( a + c ) / 2 );

	const c1_3 = cos( ( a - c ) / 2 );
	const s1_3 = sin( ( a - c ) / 2 );

	const c3_1 = cos( ( c - a ) / 2 );
	const s3_1 = sin( ( c - a ) / 2 );

	switch ( order ) {

		case 'XYX':
			q.set( c2 * s13, s2 * c1_3, s2 * s1_3, c2 * c13 );
			break;

		case 'YZY':
			q.set( s2 * s1_3, c2 * s13, s2 * c1_3, c2 * c13 );
			break;

		case 'ZXZ':
			q.set( s2 * c1_3, s2 * s1_3, c2 * s13, c2 * c13 );
			break;

		case 'XZX':
			q.set( c2 * s13, s2 * s3_1, s2 * c3_1, c2 * c13 );
			break;

		case 'YXY':
			q.set( s2 * c3_1, c2 * s13, s2 * s3_1, c2 * c13 );
			break;

		case 'ZYZ':
			q.set( s2 * s3_1, s2 * c3_1, c2 * s13, c2 * c13 );
			break;

		default:
			console.warn( 'THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ' + order );

	}

}






;// CONCATENATED MODULE: ./node_modules/three/src/math/Quaternion.js


class Quaternion {

	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

	}

	static slerp( qa, qb, qm, t ) {

		console.warn( 'THREE.Quaternion: Static .slerp() has been deprecated. Use qm.slerpQuaternions( qa, qb, t ) instead.' );
		return qm.slerpQuaternions( qa, qb, t );

	}

	static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

		// fuzz-free, array-based Quaternion SLERP operation

		let x0 = src0[ srcOffset0 + 0 ],
			y0 = src0[ srcOffset0 + 1 ],
			z0 = src0[ srcOffset0 + 2 ],
			w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 + 0 ],
			y1 = src1[ srcOffset1 + 1 ],
			z1 = src1[ srcOffset1 + 2 ],
			w1 = src1[ srcOffset1 + 3 ];

		if ( t === 0 ) {

			dst[ dstOffset + 0 ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;
			return;

		}

		if ( t === 1 ) {

			dst[ dstOffset + 0 ] = x1;
			dst[ dstOffset + 1 ] = y1;
			dst[ dstOffset + 2 ] = z1;
			dst[ dstOffset + 3 ] = w1;
			return;

		}

		if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

			let s = 1 - t;
			const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
				dir = ( cos >= 0 ? 1 : - 1 ),
				sqrSin = 1 - cos * cos;

			// Skip the Slerp for tiny steps to avoid numeric problems:
			if ( sqrSin > Number.EPSILON ) {

				const sin = Math.sqrt( sqrSin ),
					len = Math.atan2( sin, cos * dir );

				s = Math.sin( s * len ) / sin;
				t = Math.sin( t * len ) / sin;

			}

			const tDir = t * dir;

			x0 = x0 * s + x1 * tDir;
			y0 = y0 * s + y1 * tDir;
			z0 = z0 * s + z1 * tDir;
			w0 = w0 * s + w1 * tDir;

			// Normalize in case we just did a lerp:
			if ( s === 1 - t ) {

				const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

				x0 *= f;
				y0 *= f;
				z0 *= f;
				w0 *= f;

			}

		}

		dst[ dstOffset ] = x0;
		dst[ dstOffset + 1 ] = y0;
		dst[ dstOffset + 2 ] = z0;
		dst[ dstOffset + 3 ] = w0;

	}

	static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

		const x0 = src0[ srcOffset0 ];
		const y0 = src0[ srcOffset0 + 1 ];
		const z0 = src0[ srcOffset0 + 2 ];
		const w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 ];
		const y1 = src1[ srcOffset1 + 1 ];
		const z1 = src1[ srcOffset1 + 2 ];
		const w1 = src1[ srcOffset1 + 3 ];

		dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
		dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
		dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
		dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

		return dst;

	}

	get x() {

		return this._x;

	}

	set x( value ) {

		this._x = value;
		this._onChangeCallback();

	}

	get y() {

		return this._y;

	}

	set y( value ) {

		this._y = value;
		this._onChangeCallback();

	}

	get z() {

		return this._z;

	}

	set z( value ) {

		this._z = value;
		this._onChangeCallback();

	}

	get w() {

		return this._w;

	}

	set w( value ) {

		this._w = value;
		this._onChangeCallback();

	}

	set( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this._onChangeCallback();

		return this;

	}

	clone() {

		return new this.constructor( this._x, this._y, this._z, this._w );

	}

	copy( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this._onChangeCallback();

		return this;

	}

	setFromEuler( euler, update ) {

		if ( ! ( euler && euler.isEuler ) ) {

			throw new Error( 'THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.' );

		}

		const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		const cos = Math.cos;
		const sin = Math.sin;

		const c1 = cos( x / 2 );
		const c2 = cos( y / 2 );
		const c3 = cos( z / 2 );

		const s1 = sin( x / 2 );
		const s2 = sin( y / 2 );
		const s3 = sin( z / 2 );

		switch ( order ) {

			case 'XYZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'YXZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'ZXY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'ZYX':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'YZX':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'XZY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			default:
				console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

		}

		if ( update !== false ) this._onChangeCallback();

		return this;

	}

	setFromAxisAngle( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this._onChangeCallback();

		return this;

	}

	setFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		const te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33;

		if ( trace > 0 ) {

			const s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this._onChangeCallback();

		return this;

	}

	setFromUnitVectors( vFrom, vTo ) {

		// assumes direction vectors vFrom and vTo are normalized

		let r = vFrom.dot( vTo ) + 1;

		if ( r < Number.EPSILON ) {

			// vFrom and vTo point in opposite directions

			r = 0;

			if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

				this._x = - vFrom.y;
				this._y = vFrom.x;
				this._z = 0;
				this._w = r;

			} else {

				this._x = 0;
				this._y = - vFrom.z;
				this._z = vFrom.y;
				this._w = r;

			}

		} else {

			// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

			this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
			this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
			this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
			this._w = r;

		}

		return this.normalize();

	}

	angleTo( q ) {

		return 2 * Math.acos( Math.abs( clamp( this.dot( q ), - 1, 1 ) ) );

	}

	rotateTowards( q, step ) {

		const angle = this.angleTo( q );

		if ( angle === 0 ) return this;

		const t = Math.min( 1, step / angle );

		this.slerp( q, t );

		return this;

	}

	identity() {

		return this.set( 0, 0, 0, 1 );

	}

	invert() {

		// quaternion is assumed to have unit length

		return this.conjugate();

	}

	conjugate() {

		this._x *= - 1;
		this._y *= - 1;
		this._z *= - 1;

		this._onChangeCallback();

		return this;

	}

	dot( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	}

	lengthSq() {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	}

	length() {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	}

	normalize() {

		let l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this._onChangeCallback();

		return this;

	}

	multiply( q, p ) {

		if ( p !== undefined ) {

			console.warn( 'THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
			return this.multiplyQuaternions( q, p );

		}

		return this.multiplyQuaternions( this, q );

	}

	premultiply( q ) {

		return this.multiplyQuaternions( q, this );

	}

	multiplyQuaternions( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this._onChangeCallback();

		return this;

	}

	slerp( qb, t ) {

		if ( t === 0 ) return this;
		if ( t === 1 ) return this.copy( qb );

		const x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = - qb._w;
			this._x = - qb._x;
			this._y = - qb._y;
			this._z = - qb._z;

			cosHalfTheta = - cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

		if ( sqrSinHalfTheta <= Number.EPSILON ) {

			const s = 1 - t;
			this._w = s * w + t * this._w;
			this._x = s * x + t * this._x;
			this._y = s * y + t * this._y;
			this._z = s * z + t * this._z;

			this.normalize();
			this._onChangeCallback();

			return this;

		}

		const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
		const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
		const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
			ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this._onChangeCallback();

		return this;

	}

	slerpQuaternions( qa, qb, t ) {

		this.copy( qa ).slerp( qb, t );

	}

	equals( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	}

	fromArray( array, offset = 0 ) {

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this._onChangeCallback();

		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	}

	fromBufferAttribute( attribute, index ) {

		this._x = attribute.getX( index );
		this._y = attribute.getY( index );
		this._z = attribute.getZ( index );
		this._w = attribute.getW( index );

		return this;

	}

	_onChange( callback ) {

		this._onChangeCallback = callback;

		return this;

	}

	_onChangeCallback() {}

}

Quaternion.prototype.isQuaternion = true;



;// CONCATENATED MODULE: ./node_modules/three/src/math/Vector3.js



class Vector3 {

	constructor( x = 0, y = 0, z = 0 ) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

	set( x, y, z ) {

		if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	}

	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;

	}

	setX( x ) {

		this.x = x;

		return this;

	}

	setY( y ) {

		this.y = y;

		return this;

	}

	setZ( z ) {

		this.z = z;

		return this;

	}

	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	clone() {

		return new this.constructor( this.x, this.y, this.z );

	}

	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	}

	add( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	}

	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	}

	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	}

	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;

	}

	sub( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	}

	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;

	}

	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	}

	multiply( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
			return this.multiplyVectors( v, w );

		}

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	}

	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	}

	multiplyVectors( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	}

	applyEuler( euler ) {

		if ( ! ( euler && euler.isEuler ) ) {

			console.error( 'THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.' );

		}

		return this.applyQuaternion( _quaternion.setFromEuler( euler ) );

	}

	applyAxisAngle( axis, angle ) {

		return this.applyQuaternion( _quaternion.setFromAxisAngle( axis, angle ) );

	}

	applyMatrix3( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	}

	applyNormalMatrix( m ) {

		return this.applyMatrix3( m ).normalize();

	}

	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

		return this;

	}

	applyQuaternion( q ) {

		const x = this.x, y = this.y, z = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// calculate quat * vector

		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = - qx * x - qy * y - qz * z;

		// calculate result * inverse quat

		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;

	}

	project( camera ) {

		return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

	}

	unproject( camera ) {

		return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

	}

	transformDirection( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return this.normalize();

	}

	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	}

	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );

		return this;

	}

	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );

		return this;

	}

	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );
		this.z = Math.max( min.z, Math.min( max.z, this.z ) );

		return this;

	}

	clampScalar( minVal, maxVal ) {

		this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
		this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
		this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

		return this;

	}

	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	}

	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	}

	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	}

	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	}

	roundToZero() {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

		return this;

	}

	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	}

	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	}

	// TODO lengthSquared?

	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	}

	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	}

	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	}

	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	}

	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;

		return this;

	}

	cross( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
			return this.crossVectors( v, w );

		}

		return this.crossVectors( this, v );

	}

	crossVectors( a, b ) {

		const ax = a.x, ay = a.y, az = a.z;
		const bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	}

	projectOnVector( v ) {

		const denominator = v.lengthSq();

		if ( denominator === 0 ) return this.set( 0, 0, 0 );

		const scalar = v.dot( this ) / denominator;

		return this.copy( v ).multiplyScalar( scalar );

	}

	projectOnPlane( planeNormal ) {

		_vector.copy( this ).projectOnVector( planeNormal );

		return this.sub( _vector );

	}

	reflect( normal ) {

		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length

		return this.sub( _vector.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

	}

	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, - 1, 1 ) );

	}

	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	}

	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

	}

	setFromSpherical( s ) {

		return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

	}

	setFromSphericalCoords( radius, phi, theta ) {

		const sinPhiRadius = Math.sin( phi ) * radius;

		this.x = sinPhiRadius * Math.sin( theta );
		this.y = Math.cos( phi ) * radius;
		this.z = sinPhiRadius * Math.cos( theta );

		return this;

	}

	setFromCylindrical( c ) {

		return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

	}

	setFromCylindricalCoords( radius, theta, y ) {

		this.x = radius * Math.sin( theta );
		this.y = y;
		this.z = radius * Math.cos( theta );

		return this;

	}

	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];

		return this;

	}

	setFromMatrixScale( m ) {

		const sx = this.setFromMatrixColumn( m, 0 ).length();
		const sy = this.setFromMatrixColumn( m, 1 ).length();
		const sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	}

	setFromMatrixColumn( m, index ) {

		return this.fromArray( m.elements, index * 4 );

	}

	setFromMatrix3Column( m, index ) {

		return this.fromArray( m.elements, index * 3 );

	}

	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	}

	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	}

	fromBufferAttribute( attribute, index, offset ) {

		if ( offset !== undefined ) {

			console.warn( 'THREE.Vector3: offset has been removed from .fromBufferAttribute().' );

		}

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );

		return this;

	}

	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();

		return this;

	}

}

Vector3.prototype.isVector3 = true;

const _vector = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ new Quaternion();



;// CONCATENATED MODULE: ./node_modules/three/src/math/Matrix3.js
class Matrix3 {

	constructor() {

		this.elements = [

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		];

		if ( arguments.length > 0 ) {

			console.error( 'THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.' );

		}

	}

	set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
		te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
		te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

		return this;

	}

	identity() {

		this.set(

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		);

		return this;

	}

	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
		te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
		te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

		return this;

	}

	extractBasis( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrix3Column( this, 0 );
		yAxis.setFromMatrix3Column( this, 1 );
		zAxis.setFromMatrix3Column( this, 2 );

		return this;

	}

	setFromMatrix4( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 4 ], me[ 8 ],
			me[ 1 ], me[ 5 ], me[ 9 ],
			me[ 2 ], me[ 6 ], me[ 10 ]

		);

		return this;

	}

	multiply( m ) {

		return this.multiplyMatrices( this, m );

	}

	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
		const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
		const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

		const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
		const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
		const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
		te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
		te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
		te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
		te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
		te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
		te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;

	}

	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
		te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
		te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

		return this;

	}

	determinant() {

		const te = this.elements;

		const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
			d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
			g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

	}

	invert() {

		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
			n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
			n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

			t11 = n33 * n22 - n32 * n23,
			t12 = n32 * n13 - n33 * n12,
			t13 = n23 * n12 - n22 * n13,

			det = n11 * t11 + n21 * t12 + n31 * t13;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
		te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

		te[ 3 ] = t12 * detInv;
		te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
		te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

		te[ 6 ] = t13 * detInv;
		te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
		te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

		return this;

	}

	transpose() {

		let tmp;
		const m = this.elements;

		tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
		tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
		tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

		return this;

	}

	getNormalMatrix( matrix4 ) {

		return this.setFromMatrix4( matrix4 ).invert().transpose();

	}

	transposeIntoArray( r ) {

		const m = this.elements;

		r[ 0 ] = m[ 0 ];
		r[ 1 ] = m[ 3 ];
		r[ 2 ] = m[ 6 ];
		r[ 3 ] = m[ 1 ];
		r[ 4 ] = m[ 4 ];
		r[ 5 ] = m[ 7 ];
		r[ 6 ] = m[ 2 ];
		r[ 7 ] = m[ 5 ];
		r[ 8 ] = m[ 8 ];

		return this;

	}

	setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

		const c = Math.cos( rotation );
		const s = Math.sin( rotation );

		this.set(
			sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
			- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
			0, 0, 1
		);

		return this;

	}

	scale( sx, sy ) {

		const te = this.elements;

		te[ 0 ] *= sx; te[ 3 ] *= sx; te[ 6 ] *= sx;
		te[ 1 ] *= sy; te[ 4 ] *= sy; te[ 7 ] *= sy;

		return this;

	}

	rotate( theta ) {

		const c = Math.cos( theta );
		const s = Math.sin( theta );

		const te = this.elements;

		const a11 = te[ 0 ], a12 = te[ 3 ], a13 = te[ 6 ];
		const a21 = te[ 1 ], a22 = te[ 4 ], a23 = te[ 7 ];

		te[ 0 ] = c * a11 + s * a21;
		te[ 3 ] = c * a12 + s * a22;
		te[ 6 ] = c * a13 + s * a23;

		te[ 1 ] = - s * a11 + c * a21;
		te[ 4 ] = - s * a12 + c * a22;
		te[ 7 ] = - s * a13 + c * a23;

		return this;

	}

	translate( tx, ty ) {

		const te = this.elements;

		te[ 0 ] += tx * te[ 2 ]; te[ 3 ] += tx * te[ 5 ]; te[ 6 ] += tx * te[ 8 ];
		te[ 1 ] += ty * te[ 2 ]; te[ 4 ] += ty * te[ 5 ]; te[ 7 ] += ty * te[ 8 ];

		return this;

	}

	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 9; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 9; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];

		array[ offset + 3 ] = te[ 3 ];
		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];

		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];
		array[ offset + 8 ] = te[ 8 ];

		return array;

	}

	clone() {

		return new this.constructor().fromArray( this.elements );

	}

}

Matrix3.prototype.isMatrix3 = true;



;// CONCATENATED MODULE: ./node_modules/three/src/math/Matrix4.js


class Matrix4 {

	constructor() {

		this.elements = [

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		];

		if ( arguments.length > 0 ) {

			console.error( 'THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.' );

		}

	}

	set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
		te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
		te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
		te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

		return this;

	}

	identity() {

		this.set(

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	clone() {

		return new Matrix4().fromArray( this.elements );

	}

	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
		te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
		te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
		te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

		return this;

	}

	copyPosition( m ) {

		const te = this.elements, me = m.elements;

		te[ 12 ] = me[ 12 ];
		te[ 13 ] = me[ 13 ];
		te[ 14 ] = me[ 14 ];

		return this;

	}

	setFromMatrix3( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 3 ], me[ 6 ], 0,
			me[ 1 ], me[ 4 ], me[ 7 ], 0,
			me[ 2 ], me[ 5 ], me[ 8 ], 0,
			0, 0, 0, 1

		);

		return this;

	}

	extractBasis( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrixColumn( this, 0 );
		yAxis.setFromMatrixColumn( this, 1 );
		zAxis.setFromMatrixColumn( this, 2 );

		return this;

	}

	makeBasis( xAxis, yAxis, zAxis ) {

		this.set(
			xAxis.x, yAxis.x, zAxis.x, 0,
			xAxis.y, yAxis.y, zAxis.y, 0,
			xAxis.z, yAxis.z, zAxis.z, 0,
			0, 0, 0, 1
		);

		return this;

	}

	extractRotation( m ) {

		// this method does not support reflection matrices

		const te = this.elements;
		const me = m.elements;

		const scaleX = 1 / _v1.setFromMatrixColumn( m, 0 ).length();
		const scaleY = 1 / _v1.setFromMatrixColumn( m, 1 ).length();
		const scaleZ = 1 / _v1.setFromMatrixColumn( m, 2 ).length();

		te[ 0 ] = me[ 0 ] * scaleX;
		te[ 1 ] = me[ 1 ] * scaleX;
		te[ 2 ] = me[ 2 ] * scaleX;
		te[ 3 ] = 0;

		te[ 4 ] = me[ 4 ] * scaleY;
		te[ 5 ] = me[ 5 ] * scaleY;
		te[ 6 ] = me[ 6 ] * scaleY;
		te[ 7 ] = 0;

		te[ 8 ] = me[ 8 ] * scaleZ;
		te[ 9 ] = me[ 9 ] * scaleZ;
		te[ 10 ] = me[ 10 ] * scaleZ;
		te[ 11 ] = 0;

		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	makeRotationFromEuler( euler ) {

		if ( ! ( euler && euler.isEuler ) ) {

			console.error( 'THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.' );

		}

		const te = this.elements;

		const x = euler.x, y = euler.y, z = euler.z;
		const a = Math.cos( x ), b = Math.sin( x );
		const c = Math.cos( y ), d = Math.sin( y );
		const e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YZX' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// bottom row
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// last column
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	makeRotationFromQuaternion( q ) {

		return this.compose( _zero, q, _one );

	}

	lookAt( eye, target, up ) {

		const te = this.elements;

		_z.subVectors( eye, target );

		if ( _z.lengthSq() === 0 ) {

			// eye and target are in the same position

			_z.z = 1;

		}

		_z.normalize();
		_x.crossVectors( up, _z );

		if ( _x.lengthSq() === 0 ) {

			// up and z are parallel

			if ( Math.abs( up.z ) === 1 ) {

				_z.x += 0.0001;

			} else {

				_z.z += 0.0001;

			}

			_z.normalize();
			_x.crossVectors( up, _z );

		}

		_x.normalize();
		_y.crossVectors( _z, _x );

		te[ 0 ] = _x.x; te[ 4 ] = _y.x; te[ 8 ] = _z.x;
		te[ 1 ] = _x.y; te[ 5 ] = _y.y; te[ 9 ] = _z.y;
		te[ 2 ] = _x.z; te[ 6 ] = _y.z; te[ 10 ] = _z.z;

		return this;

	}

	multiply( m, n ) {

		if ( n !== undefined ) {

			console.warn( 'THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.' );
			return this.multiplyMatrices( m, n );

		}

		return this.multiplyMatrices( this, m );

	}

	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
		const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
		const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
		const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

		const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
		const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
		const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
		const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;

	}

	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
		te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
		te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
		te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

		return this;

	}

	determinant() {

		const te = this.elements;

		const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
		const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
		const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
		const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

		//TODO: make this more efficient
		//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

		return (
			n41 * (
				+ n14 * n23 * n32
				 - n13 * n24 * n32
				 - n14 * n22 * n33
				 + n12 * n24 * n33
				 + n13 * n22 * n34
				 - n12 * n23 * n34
			) +
			n42 * (
				+ n11 * n23 * n34
				 - n11 * n24 * n33
				 + n14 * n21 * n33
				 - n13 * n21 * n34
				 + n13 * n24 * n31
				 - n14 * n23 * n31
			) +
			n43 * (
				+ n11 * n24 * n32
				 - n11 * n22 * n34
				 - n14 * n21 * n32
				 + n12 * n21 * n34
				 + n14 * n22 * n31
				 - n12 * n24 * n31
			) +
			n44 * (
				- n13 * n22 * n31
				 - n11 * n23 * n32
				 + n11 * n22 * n33
				 + n13 * n21 * n32
				 - n12 * n21 * n33
				 + n12 * n23 * n31
			)

		);

	}

	transpose() {

		const te = this.elements;
		let tmp;

		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

		return this;

	}

	setPosition( x, y, z ) {

		const te = this.elements;

		if ( x.isVector3 ) {

			te[ 12 ] = x.x;
			te[ 13 ] = x.y;
			te[ 14 ] = x.z;

		} else {

			te[ 12 ] = x;
			te[ 13 ] = y;
			te[ 14 ] = z;

		}

		return this;

	}

	invert() {

		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
			n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
			n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
			n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

			t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
			t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
			t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
			t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
		te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
		te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

		te[ 4 ] = t12 * detInv;
		te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
		te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
		te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

		te[ 8 ] = t13 * detInv;
		te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
		te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
		te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

		te[ 12 ] = t14 * detInv;
		te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
		te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
		te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

		return this;

	}

	scale( v ) {

		const te = this.elements;
		const x = v.x, y = v.y, z = v.z;

		te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
		te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
		te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
		te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

		return this;

	}

	getMaxScaleOnAxis() {

		const te = this.elements;

		const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
		const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
		const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

		return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

	}

	makeTranslation( x, y, z ) {

		this.set(

			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1

		);

		return this;

	}

	makeRotationX( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			1, 0, 0, 0,
			0, c, - s, 0,
			0, s, c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	makeRotationY( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			 c, 0, s, 0,
			 0, 1, 0, 0,
			- s, 0, c, 0,
			 0, 0, 0, 1

		);

		return this;

	}

	makeRotationZ( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			c, - s, 0, 0,
			s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	makeRotationAxis( axis, angle ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		const c = Math.cos( angle );
		const s = Math.sin( angle );
		const t = 1 - c;
		const x = axis.x, y = axis.y, z = axis.z;
		const tx = t * x, ty = t * y;

		this.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	makeScale( x, y, z ) {

		this.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return this;

	}

	makeShear( xy, xz, yx, yz, zx, zy ) {

		this.set(

			1, yx, zx, 0,
			xy, 1, zy, 0,
			xz, yz, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	compose( position, quaternion, scale ) {

		const te = this.elements;

		const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
		const x2 = x + x,	y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x, sy = scale.y, sz = scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = position.x;
		te[ 13 ] = position.y;
		te[ 14 ] = position.z;
		te[ 15 ] = 1;

		return this;

	}

	decompose( position, quaternion, scale ) {

		const te = this.elements;

		let sx = _v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
		const sy = _v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
		const sz = _v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

		// if determine is negative, we need to invert one scale
		const det = this.determinant();
		if ( det < 0 ) sx = - sx;

		position.x = te[ 12 ];
		position.y = te[ 13 ];
		position.z = te[ 14 ];

		// scale the rotation part
		_m1.copy( this );

		const invSX = 1 / sx;
		const invSY = 1 / sy;
		const invSZ = 1 / sz;

		_m1.elements[ 0 ] *= invSX;
		_m1.elements[ 1 ] *= invSX;
		_m1.elements[ 2 ] *= invSX;

		_m1.elements[ 4 ] *= invSY;
		_m1.elements[ 5 ] *= invSY;
		_m1.elements[ 6 ] *= invSY;

		_m1.elements[ 8 ] *= invSZ;
		_m1.elements[ 9 ] *= invSZ;
		_m1.elements[ 10 ] *= invSZ;

		quaternion.setFromRotationMatrix( _m1 );

		scale.x = sx;
		scale.y = sy;
		scale.z = sz;

		return this;

	}

	makePerspective( left, right, top, bottom, near, far ) {

		if ( far === undefined ) {

			console.warn( 'THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.' );

		}

		const te = this.elements;
		const x = 2 * near / ( right - left );
		const y = 2 * near / ( top - bottom );

		const a = ( right + left ) / ( right - left );
		const b = ( top + bottom ) / ( top - bottom );
		const c = - ( far + near ) / ( far - near );
		const d = - 2 * far * near / ( far - near );

		te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a;	te[ 12 ] = 0;
		te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b;	te[ 13 ] = 0;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c;	te[ 14 ] = d;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

		return this;

	}

	makeOrthographic( left, right, top, bottom, near, far ) {

		const te = this.elements;
		const w = 1.0 / ( right - left );
		const h = 1.0 / ( top - bottom );
		const p = 1.0 / ( far - near );

		const x = ( right + left ) * w;
		const y = ( top + bottom ) * h;
		const z = ( far + near ) * p;

		te[ 0 ] = 2 * w;	te[ 4 ] = 0;	te[ 8 ] = 0;	te[ 12 ] = - x;
		te[ 1 ] = 0;	te[ 5 ] = 2 * h;	te[ 9 ] = 0;	te[ 13 ] = - y;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = - 2 * p;	te[ 14 ] = - z;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = 0;	te[ 15 ] = 1;

		return this;

	}

	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 16; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 16; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];
		array[ offset + 3 ] = te[ 3 ];

		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];
		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];

		array[ offset + 8 ] = te[ 8 ];
		array[ offset + 9 ] = te[ 9 ];
		array[ offset + 10 ] = te[ 10 ];
		array[ offset + 11 ] = te[ 11 ];

		array[ offset + 12 ] = te[ 12 ];
		array[ offset + 13 ] = te[ 13 ];
		array[ offset + 14 ] = te[ 14 ];
		array[ offset + 15 ] = te[ 15 ];

		return array;

	}

}

Matrix4.prototype.isMatrix4 = true;

const _v1 = /*@__PURE__*/ new Vector3();
const _m1 = /*@__PURE__*/ new Matrix4();
const _zero = /*@__PURE__*/ new Vector3( 0, 0, 0 );
const _one = /*@__PURE__*/ new Vector3( 1, 1, 1 );
const _x = /*@__PURE__*/ new Vector3();
const _y = /*@__PURE__*/ new Vector3();
const _z = /*@__PURE__*/ new Vector3();



;// CONCATENATED MODULE: ./src/glsl/decl.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// AST node parsers







let decl = {};

decl.in = 0;
decl.out = 1;
decl.inout = 2;

const get = (n) => n.token.data;

decl.node = function (node) {
  if (
    (node.children[5] != null ? node.children[5].type : undefined) ===
    "function"
  ) {
    return decl.function(node);
  } else if ((node.token != null ? node.token.type : undefined) === "keyword") {
    return decl.external(node);
  }
};

decl.external = function (node) {
  //    console.log 'external', node
  let c = node.children;

  let storage = get(c[1]);
  const struct = get(c[3]);
  const type = get(c[4]);
  const list = c[5];

  if (!["attribute", "uniform", "varying"].includes(storage)) {
    storage = "global";
  }

  const out = [];

  for (let i = 0; i < list.children.length; i++) {
    c = list.children[i];
    if (c.type === "ident") {
      const ident = get(c);
      const next = list.children[i + 1];
      const quant = (next != null ? next.type : undefined) === "quantifier";

      out.push({
        decl: "external",
        storage,
        type,
        ident,
        quant: !!quant,
        count: quant,
      });
    }
  }

  return out;
};

decl.function = function (node) {
  const c = node.children;

  //    console.log 'function', node

  const storage = get(c[1]);
  const struct = get(c[3]);
  const type = get(c[4]);
  const func = c[5];
  const ident = get(func.children[0]);
  const args = func.children[1];
  const body = func.children[2];

  const decls = Array.from(args.children).map((child) => decl.argument(child));

  return [
    {
      decl: "function",
      storage,
      type,
      ident,
      body: !!body,
      args: decls,
    },
  ];
};

decl.argument = function (node) {
  const c = node.children;

  //    console.log 'argument', node

  const storage = get(c[1]);
  const inout = get(c[2]);
  const type = get(c[4]);
  const list = c[5];
  const ident = get(list.children[0]);
  const quant = list.children[1];

  const count = quant ? quant.children[0].token.data : undefined;

  return {
    decl: "argument",
    storage,
    inout,
    type,
    ident,
    quant: !!quant,
    count,
  };
};

decl.param = function (dir, storage, spec, quant, count) {
  let prefix = [];
  if (storage != null) {
    prefix.push(storage);
  }
  if (spec != null) {
    prefix.push(spec);
  }
  prefix.push("");

  prefix = prefix.join(" ");
  const suffix = quant ? "[" + count + "]" : "";
  if (dir !== "") {
    dir += " ";
  }

  const f = (name, long) => (long ? dir : "") + `${prefix}${name}${suffix}`;
  f.split = (dir) => decl.param(dir, storage, spec, quant, count);

  return f;
};

// Three.js sugar
const win = typeof window !== "undefined";
const threejs = win && !!window.THREE;

const defaults = {
  int: 0,
  float: 0,
  vec2: threejs ? Vector2 : null,
  vec3: threejs ? Vector3 : null,
  vec4: threejs ? Vector3_namespaceObject.Vector4 : null,
  mat2: null,
  mat3: threejs ? Matrix3 : null,
  mat4: threejs ? Matrix4 : null,
  sampler2D: 0,
  samplerCube: 0,
};

const three = {
  int: "i",
  float: "f",
  vec2: "v2",
  vec3: "v3",
  vec4: "v4",
  mat2: "m2",
  mat3: "m3",
  mat4: "m4",
  sampler2D: "t",
  samplerCube: "t",
};

decl.type = function (name, spec, quant, count, dir, storage) {
  const dirs = {
    in: decl.in,
    out: decl.out,
    inout: decl.inout,
  };

  const storages = { const: "const" };

  let type = three[spec];
  if (quant) {
    type += "v";
  }

  let value = defaults[spec];
  if (value != null ? value.call : undefined) {
    value = new value();
  }
  if (quant) {
    value = [value];
  }

  const inout = dirs[dir] != null ? dirs[dir] : dirs.in;
  storage = storages[storage];

  const param = decl.param(dir, storage, spec, quant, count);
  return new Definition(name, type, spec, param, value, inout);
};

class Definition {
  constructor(name, type, spec, param, value, inout, meta) {
    this.name = name;
    this.type = type;
    this.spec = spec;
    this.param = param;
    this.value = value;
    this.inout = inout;
    this.meta = meta;
  }

  split() {
    // Split inouts
    const isIn = this.meta.shadowed != null;
    const dir = isIn ? "in" : "out";
    const inout = isIn ? decl.in : decl.out;
    const param = this.param.split(dir);
    return new Definition(
      this.name,
      this.type,
      this.spec,
      param,
      this.value,
      inout
    );
  }

  copy(name, meta) {
    let def;
    return (def = new Definition(
      name != null ? name : this.name,
      this.type,
      this.spec,
      this.param,
      this.value,
      this.inout,
      meta
    ));
  }
}

;// CONCATENATED MODULE: ./src/glsl/constants.js
const SHADOW_ARG = "_i_o";
const RETURN_ARG = "return";

;// CONCATENATED MODULE: ./src/glsl/parse.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */





let parse_debug = false;

/*
parse GLSL into AST
extract all global symbols and make type signatures
*/
// Parse a GLSL snippet
const parse = function (name, code) {
  const ast = parseGLSL(name, code);
  return processAST(ast, code);
};

// Parse GLSL language into AST
var parseGLSL = function (name, code) {
  let ast, tock;
  let errors = [];
  if (parse_debug) {
    tock = parse_tick();
  }

  try {
    const tokens = string_default()(code);
    ast = direct_default()(tokens);
  } catch (e) {
    errors = [{ message: e }];
  }

  if (parse_debug) {
    tock("GLSL Tokenize & Parse");
  }

  const fmt = function (code) {
    code = code.split("\n");
    const max = ("" + code.length).length;
    const pad = function (v) {
      if ((v = "" + v).length < max) {
        return ("       " + v).slice(-max);
      } else {
        return v;
      }
    };
    return code.map((line, i) => `${pad(i + 1)}: ${line}`).join("\n");
  };

  if (!ast || errors.length) {
    if (!name) {
      name = "(inline code)";
    }
    console.warn(fmt(code));
    for (let error of errors) {
      console.error(`${name} -`, error.message);
    }
    throw new Error("GLSL parse error");
  }

  return ast;
};

// Process AST for compilation
var processAST = function (ast, code) {
  let tock;
  if (parse_debug) {
    tock = parse_tick();
  }

  // Walk AST tree and collect global declarations
  const symbols = [];
  walk(mapSymbols, collect(symbols), ast, "");

  // Sort symbols into bins
  const [main, internals, externals] = Array.from(sortSymbols(symbols));

  // Extract storage/type signatures of symbols
  const signatures = extractSignatures(main, internals, externals);

  if (parse_debug) {
    tock("GLSL AST");
  }

  return { ast, code, signatures };
};

// Extract functions and external symbols from AST
var mapSymbols = function (node, collect) {
  switch (node.type) {
    case "decl":
      collect(decl.node(node));
      return false;
  }
  return true;
};

const collect = (out) =>
  function (value) {
    if (value != null) {
      Array.from(value).map((obj) => out.push(obj));
    }
  };

// Identify internals, externals and main function
var sortSymbols = function (symbols) {
  let main = null;
  const internals = [];
  let externals = [];
  const maybe = {};
  let found = false;

  for (var s of Array.from(symbols)) {
    if (!s.body) {
      // Unmarked globals are definitely internal
      if (s.storage === "global") {
        internals.push(s);

        // Possible external
      } else {
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      // Remove earlier forward declaration
      if (maybe[s.ident]) {
        externals = Array.from(externals).filter((e) => e.ident !== s.ident);
        delete maybe[s.ident];
      }

      // Internal function
      internals.push(s);

      // Last function is main
      // unless there is a function called 'main'
      if (s.ident === "main") {
        main = s;
        found = true;
      } else if (!found) {
        main = s;
      }
    }
  }

  return [main, internals, externals];
};

// Generate type signatures and appropriate ins/outs
var extractSignatures = function (main, internals, externals) {
  let symbol;
  const sigs = {
    uniform: [],
    attribute: [],
    varying: [],
    external: [],
    internal: [],
    global: [],
    main: null,
  };

  const defn = (symbol) =>
    decl.type(
      symbol.ident,
      symbol.type,
      symbol.quant,
      symbol.count,
      symbol.inout,
      symbol.storage
    );

  const func = function (symbol, inout) {
    let d;
    const signature = Array.from(symbol.args).map((arg) => defn(arg));

    // Split inouts into in and out
    for (d of Array.from(signature)) {
      if (d.inout === decl.inout) {
        const a = d;
        const b = d.copy();

        a.inout = decl.in;
        b.inout = decl.out;
        b.meta = { shadow: a.name };
        b.name += SHADOW_ARG;
        a.meta = { shadowed: b.name };

        signature.push(b);
      }
    }

    // Add output for return type
    if (symbol.type !== "void") {
      signature.unshift(decl.type(RETURN_ARG, symbol.type, false, "", "out"));
    }

    // Make type string
    const inTypes = (() => {
      const result = [];
      for (d of Array.from(signature)) {
        if (d.inout === decl.in) {
          result.push(d.type);
        }
      }
      return result;
    })().join(",");
    const outTypes = (() => {
      const result1 = [];
      for (d of Array.from(signature)) {
        if (d.inout === decl.out) {
          result1.push(d.type);
        }
      }
      return result1;
    })().join(",");
    const type = `(${inTypes})(${outTypes})`;

    return {
      name: symbol.ident,
      type,
      signature,
      inout,
      spec: symbol.type,
    };
  };

  // Main
  sigs.main = func(main, decl.out);

  // Internals (for name replacement only)
  for (symbol of Array.from(internals)) {
    sigs.internal.push({
      name: symbol.ident,
    });
  }

  // Externals
  for (symbol of Array.from(externals)) {
    switch (symbol.decl) {
      // Uniforms/attributes/varyings
      case "external":
        var def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;

      // Callbacks
      case "function":
        def = func(symbol, decl.in);
        sigs.external.push(def);
        break;
    }
  }

  return sigs;
};

// Walk AST, apply map and collect values
parse_debug = false;

var walk = function (map, collect, node, indent) {
  parse_debug &&
    console.log(
      indent,
      node.type,
      node.token != null ? node.token.data : undefined,
      node.token != null ? node.token.type : undefined
    );

  const recurse = map(node, collect);

  if (recurse) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      walk(map, collect, child, indent + "  ", parse_debug);
    }
  }

  return null;
};

// #####

var parse_tick = function () {
  const now = +new Date();
  return function (label) {
    const delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

;// CONCATENATED MODULE: ./src/glsl/generate.js
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */




/*
  GLSL code generator for compiler and linker stubs
*/

// Check if shadow outlet
function unshadow(name) {
  const real = name.replace(SHADOW_ARG, "");
  if (real !== name) {
    return real;
  } else {
    return null;
  }
}

// Line joiners
function lines(lines) {
  return lines.join("\n");
}
function list(lines) {
  return lines.join(", ");
}
function statements(lines) {
  return lines.join(";\n");
}

// Function body
function body(entry) {
  return {
    entry,
    type: "void",
    params: [],
    signature: [],
    return: "",
    vars: {},
    calls: [],
    post: [],
    chain: {},
  };
}

// Symbol define
function generate_define(a, b) {
  return `#define ${a} ${b}`;
}

// Function define
function fn(type, entry, params, vars, calls) {
  return `${type} ${entry}(${params}) {\n${vars}${calls}}`;
}

// Function invocation
function invoke(ret, entry, args) {
  ret = ret ? `${ret} = ` : "";
  args = list(args);
  return `  ${ret}${entry}(${args})`;
}

// Compare two signatures
function same(a, b) {
  for (let i = 0; i < a.length; i++) {
    const A = a[i];
    const B = b[i];
    if (!B) {
      return false;
    }
    if (A.type !== B.type) {
      return false;
    }
    if ((A.name === RETURN_ARG) !== (B.name === RETURN_ARG)) {
      return false;
    }
  }
  return true;
}

// Generate call signature for module invocation
function call(lookup, dangling, entry, signature, body) {
  const args = [];
  let ret = "";
  const rets = 1;

  for (let arg of Array.from(signature)) {
    var id, shadow;
    const { name } = arg;

    let copy = (id = lookup(name));
    let other = null;
    let meta = null;
    let omit = false;
    const { inout } = arg;

    const isReturn = name === RETURN_ARG;

    // Shadowed inout: input side
    if ((shadow = arg.meta != null ? arg.meta.shadowed : undefined)) {
      other = lookup(shadow);
      if (other) {
        body.vars[other] = "  " + arg.param(other);
        body.calls.push(`  ${other} = ${id}`);

        if (!dangling(shadow)) {
          arg = arg.split();
        } else {
          meta = { shadowed: other };
        }
      }
    }

    // Shadowed inout: output side
    if ((shadow = arg.meta != null ? arg.meta.shadow : undefined)) {
      other = lookup(shadow);
      if (other) {
        if (!dangling(shadow)) {
          arg = arg.split();
          omit = true;
        } else {
          meta = { shadow: other };
          continue;
        }
      }
    }

    if (isReturn) {
      // Capture return value
      ret = id;
    } else if (!omit) {
      // Pass all non return, non shadow args in
      args.push(other != null ? other : id);
    }

    // Export argument if unconnected
    if (dangling(name)) {
      let op = "push";
      if (isReturn) {
        if (body.return === "") {
          op = "unshift";
          // Preserve 'return' arg name
          copy = name;
          body.type = arg.spec;
          body.return = `  return ${id}`;
          body.vars[id] = "  " + arg.param(id);
        } else {
          body.vars[id] = "  " + arg.param(id);
          body.params.push(arg.param(id, true));
        }
      } else {
        body.params.push(arg.param(id, true));
      }

      // Copy argument into new signature
      arg = arg.copy(copy, meta);
      body.signature[op](arg);
    } else {
      body.vars[id] = "  " + arg.param(id);
    }
  }

  return body.calls.push(invoke(ret, entry, args));
}

// Assemble main() function from body and call reference
function build(body, calls) {
  const { entry } = body;
  let code = null;

  // Check if we're only calling one snippet with identical signature
  // and not building void main();
  if (calls && calls.length === 1 && entry !== "main") {
    const a = body;
    const b = calls[0].module;

    if (same(body.signature, b.main.signature)) {
      code = generate_define(entry, b.entry);
    }
  }

  // Otherwise build function body
  if (code == null) {
    let vars = (() => {
      const result = [];
      for (let v in body.vars) {
        const decl = body.vars[v];
        result.push(decl);
      }
      return result;
    })();
    ({ calls } = body);
    const { post } = body;
    let { params } = body;
    const { type } = body;
    const ret = body.return;

    calls = calls.concat(post);
    if (ret !== "") {
      calls.push(ret);
    }
    calls.push("");

    if (vars.length) {
      vars.push("");
      vars = statements(vars) + "\n";
    } else {
      vars = "";
    }

    calls = statements(calls);
    params = list(params);

    code = fn(type, entry, params, vars, calls);
  }

  return {
    signature: body.signature,
    code,
    name: entry,
  };
}

// Build links to other callbacks
function links(links) {
  const out = {
    defs: [],
    bodies: [],
  };

  for (let l of Array.from(links)) {
    generate_link(l, out);
  }

  out.defs = lines(out.defs);
  out.bodies = statements(out.bodies);

  if (out.defs === "") {
    delete out.defs;
  }
  if (out.bodies === "") {
    delete out.bodies;
  }

  return out;
}

// Link a module's entry point as a callback
const generate_link = (link, out) => {
  let arg, list;
  const { module, name, external } = link;
  const { main } = module;
  const { entry } = module;

  // If signatures match, #define alias for the symbol
  if (same(main.signature, external.signature)) {
    return out.defs.push(generate_define(name, entry));
  }

  // Signatures differ, build one-line callback to match defined prototype

  // Map names to names
  const ins = [];
  const outs = [];
  let map = {};
  const returnVar = [module.namespace, RETURN_ARG].join("");

  for (arg of Array.from(external.signature)) {
    list = arg.inout === IN ? ins : outs;
    list.push(arg);
  }

  for (arg of Array.from(main.signature)) {
    list = arg.inout === IN ? ins : outs;
    const other = list.shift();
    let _name = other.name;

    // Avoid 'return' keyword
    if (_name === RETURN_ARG) {
      _name = returnVar;
    }

    map[arg.name] = _name;
  }

  // Build function prototype to invoke the other side
  let _lookup = (name) => map[name];
  const _dangling = () => true;

  const inner = body();
  call(_lookup, _dangling, entry, main.signature, inner);
  inner.entry = entry;

  // Avoid 'return' keyword
  map = { return: returnVar };
  _lookup = (name) => (map[name] != null ? map[name] : name);

  // Build wrapper function for the calling side
  const outer = body();
  const wrapper = call(_lookup, _dangling, entry, external.signature, outer);
  outer.calls = inner.calls;
  outer.entry = name;

  out.bodies.push(build(inner).code.split(" {")[0]);
  return out.bodies.push(build(outer).code);
};

// Remove all function prototypes to avoid redefinition errors
function defuse(code) {
  // Don't try this at home kids
  const re =
    /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/gm;
  const strip = (code) => code.replace(re, (m) => "");

  // Split into scopes by braces
  const blocks = code.split(/(?=[{}])/g);
  let level = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    switch (b[0]) {
      case "{":
        level++;
        break;
      case "}":
        level--;
        break;
    }

    // Only mess with top level scope
    if (level === 0) {
      // Preprocessor lines will fuck us up. Split on them.
      const hash = b.split(/^[ \t]*#/m);
      for (let j = 0; j < hash.length; j++) {
        let line = hash[j];
        if (j > 0) {
          // Trim off preprocessor directive
          line = line.split(/\n/);
          const head = line.shift();
          const rest = line.join("\n");

          // Process rest
          hash[j] = [head, strip(rest)].join("\n");
        } else {
          // Process entire line
          hash[j] = strip(line);
        }
      }

      // Reassemble
      blocks[i] = hash.join("#");
    }
  }

  return (code = blocks.join(""));
}

// Remove duplicate uniforms / varyings / attributes
function dedupe(code) {
  const map = {};
  const re =
    /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/gm;
  return code.replace(re, function (m, qual, type, name, struct) {
    if (map[name]) {
      return "";
    }
    map[name] = true;
    return m;
  });
}

// Move definitions to top so they compile properly
function hoist(code) {
  const filter = function (lines, re) {
    const defs = [];
    const out = [];
    for (let line of Array.from(lines)) {
      const list = line.match(re) ? defs : out;
      list.push(line);
    }

    return defs.concat(out);
  };

  let lines = code.split("\n");

  // Hoist symbol defines to the top so (re)definitions use the right alias
  lines = filter(lines, /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/);

  // Hoist extensions
  lines = filter(lines, /^#extension/);

  return lines.join("\n");
}

;// CONCATENATED MODULE: ./src/glsl/index.js





;// CONCATENATED MODULE: ./src/index.js
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */







const { library: src_library, cache: src_cache } = src_factory_namespaceObject;
const { visualize: src_visualize, inspect: src_inspect } = visualize_namespaceObject;
const { Snippet: src_Snippet } = linker_namespaceObject;

const src_merge = function (a, b = {}) {
  const out = {};
  for (let key in a) {
    out[key] = b[key] || a[key];
  }
  return out;
};

class ShaderGraph {
  constructor(snippets, config) {
    if (!(this instanceof ShaderGraph)) {
      return new ShaderGraph(snippets, config);
    }

    const defaults = {
      globalUniforms: false,
      globalVaryings: true,
      globalAttributes: true,
      globals: [],
      autoInspect: false,
    };

    this.config = src_merge(defaults, config);
    this.fetch = src_cache(src_library(glsl_namespaceObject, snippets, src_Snippet.load));
  }

  shader(config) {
    if (config == null) {
      config = {};
    }
    const _config = src_merge(this.config, config);
    return new Factory(glsl_namespaceObject, this.fetch, _config);
  }

  material(config) {
    return new Material(this.shader(config), this.shader(config));
  }

  inspect(shader) {
    return ShaderGraph.inspect(shader);
  }
  visualize(shader) {
    return ShaderGraph.visualize(shader);
  }

  // Static visualization method
  static inspect(shader) {
    return src_inspect(shader);
  }
  static visualize(shader) {
    return src_visualize(shader);
  }
}

// Expose class hierarchy
ShaderGraph.Block = Block;
ShaderGraph.Factory = src_factory_namespaceObject;
ShaderGraph.GLSL = glsl_namespaceObject;
ShaderGraph.Graph = src_graph_namespaceObject;
ShaderGraph.Linker = linker_namespaceObject;
ShaderGraph.Visualize = visualize_namespaceObject;

function src_load(snippets, config = {}) {
  return new ShaderGraph(snippets, config);
}

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=shadergraph.js.map