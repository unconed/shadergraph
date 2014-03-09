# AST node parsers

module.exports = decl = {}

decl.in    = 0
decl.out   = 1
decl.inout = 2

get = (n) -> n.token.data

decl.node = (node) ->

  if node.children[5]?.type == 'function'
    decl.function(node)

  else if node.token?.type == 'keyword'
    decl.external(node)

decl.external = (node) ->
  #    console.log 'external', node
  c = node.children

  storage = get c[1]
  struct  = get c[3]
  type    = get c[4]
  list    = c[5]

  storage = 'global' if storage !in ['attribute', 'uniform', 'varying']

  out = []

  for c, i in list.children
    if c.type == 'ident'
      ident   = get c
      next    = list.children[i + 1]
      quant   = (next?.type == 'quantifier')

      out.push
        decl: 'external'
        storage: storage
        type: type
        ident: ident
        quant: !!quant

  out

decl.function = (node) ->
  c = node.children

  #    console.log 'function', node

  storage = get c[1]
  struct  = get c[3]
  type    = get c[4]
  func    = c[5]
  ident   = get func.children[0]
  args    = func.children[1]
  body    = func.children[2]

  decls = (decl.argument(child) for child in args.children)

  [
    decl: 'function'
    storage: storage
    type: type
    ident: ident
    body: !!body
    args: decls
  ]

decl.argument = (node) ->
  c = node.children

  #    console.log 'argument', node

  storage = get c[1]
  inout   = get c[2]
  type    = get c[4]
  list    = c[5]
  ident   = get list.children[0]
  quant   = list.children[1]

  decl: 'argument'
  storage: storage
  inout: inout
  type: type
  ident: ident
  quant: !!quant

decl.copy = (type) ->
  {name, type, value, inout} = type
  {name, type, value, inout}

decl.type = (name, spec, quant, inout) ->
  three =
    float:       'f'
    vec2:        'v2'
    vec3:        'v3'
    vec4:        'v4'
    mat3:        'm3'
    mat4:        'm4'
    sampler2D:   't'
    samplerCube: 't'

  defaults =
    float:       0
    vec2:        if window.THREE then new THREE.Vector3() else null
    vec3:        if window.THREE then new THREE.Vector3() else null
    vec4:        if window.THREE then new THREE.Vector4() else null
    mat4:        if window.THREE then new THREE.Matrix4() else null
    sampler2D:   0
    samplerCube: 0

  dirs =
    in:    decl.in
    out:   decl.out
    inout: decl.inout

  type = three[spec]
  type += 'v' if quant
  value = defaults[type]
  inout = dirs[inout] ? dirs.in

  {name, type, spec, value, inout}
