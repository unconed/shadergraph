// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// Legacy shadergraph.js tests

describe("graph", function() {
  const { Graph } = ShaderGraph;

  let node1, node2, node3;
  let graph = (node1 = (node2 = (node3 = null)));
  const $ = Graph.Graph;

  // Create three nodes
  beforeEach(function() {
    graph = new Graph.Graph();

    const def1 = [
      {
        inout: $.OUT,
        name: 'matrix',
        type: 'm4',
      },
      {
        inout: $.OUT,
        name: 'position',
        type: 'v3',
      },
      {
        inout: $.OUT,
        name: 'alpha',
        type: 'f',
      },
      {
        inout: $.OUT,
        name: 'color',
        type: 'v3',
      },
      {
        inout: $.IN,
        name: 'color',
        type: 'v3',
      },
    ];

    const def2 = [
      {
        inout: $.IN,
        name: 'color',
        type: 'v3',
      },
      {
        inout: $.IN,
        name: 'position',
        type: 'v3',
      },
      {
        inout: $.IN,
        name: 'alpha',
        type: 'f',
      },
      {
        inout: $.IN,
        name: 'matrix',
        type: 'm4',
      },
      {
        inout: $.OUT,
        name: 'matrix',
        type: 'm4',
      },
    ];

    const def3 = [
      {
        inout: $.IN,
        name: 'alpha',
        type: 'f',
      },
      {
        inout: $.IN,
        name: 'color',
        type: 'v3',
      },
      {
        inout: $.IN,
        name: 'position',
        type: 'v3',
      },
      {
        inout: $.OUT,
        name: 'matrix',
        type: 'm4',
      },
    ];

    node1 = new Graph.Node(null, def1);
    node2 = new Graph.Node(null, def2);
    node3 = new Graph.Node(null, def3);

    node1.id = 'node 1';
    node2.id = 'node 2';
    return node3.id = 'node 3';
  });

  it('Created 3 test nodes with correct outlets', function() {

    expect(node1.inputs.length).toBe(1);
    expect(node1.outputs.length).toBe(4);
    expect(node2.inputs.length).toBe(4);
    expect(node2.outputs.length).toBe(1);
    expect(node3.inputs.length).toBe(3);
    expect(node3.outputs.length).toBe(1);

    expect(node1.get('position')).toBeTruthy();
    expect(node2.get('position')).toBeTruthy();
    expect(node3.get('position')).toBeTruthy();
    expect(node1.get('alpha')).toBeTruthy();
    expect(node2.get('alpha')).toBeTruthy();
    return expect(node3.get('alpha')).toBeTruthy();
  });

  it("Adds nodes to the graph", function() {
    graph.add(node1);
    graph.add(node2);
    graph.add(node3);

    expect(node1.graph).toBe(graph);
    expect(node2.graph).toBe(graph);
    return expect(node3.graph).toBe(graph);
  });

  return it('connects nodes', function() {

    const assert = function(a, b, msg) {
      if (a !== b) {
        const args = [].slice.call(arguments);
        console.error(`Failed assert: ${msg} ${args}`);
      }
      return expect(a).toBe(b);
    };

    // Connect two nodes automatically
    // Outlets must be matched by name in order for the test to pass.
    node1.connect(node2);
    assert(true, true, 'Connected Node 1 and Node 2');

    // Verify connected sockets
    assert(node2.getIn('position').input, node1.getOut('position'), 'N2 Position is wired up (in)');
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is wired up (in)');
    assert(node2.getIn('color').input, node1.getOut('color'), 'N2 Color is wired up (in)');
    assert(node2.getIn('matrix').input, node1.getOut('matrix'), 'N2 Matrix is wired up (in)');

    assert(node1.getOut('position').output.length, 1, 'N1 Position has one connection (out)');
    assert(node1.getOut('alpha').output.length, 1, 'N1 Alpha has one connection (out)');
    assert(node1.getOut('color').output.length, 1, 'N1 Color has one connection (out)');
    assert(node1.getOut('matrix').output.length, 1, 'N1 Matrix has one connection (out)');

    assert(node2.getIn('position'), node1.getOut('position').output[0], 'N1 Position is wired up (out)');
    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is wired up (out)');
    assert(node2.getIn('color'), node1.getOut('color').output[0], 'N1 Color is wired up (out)');
    assert(node2.getIn('matrix'), node1.getOut('matrix').output[0], 'M1 Matrix is wired up (out)');

    // Verify other inputs/outputs are untouched
    assert(node2.getOut('matrix').output.length, 0, 'N2 Matrix is ignored (out)');
    assert(node1.getIn('color').input, null, 'N1 Color is ignored (in)');

    // Disconnect from the out side
    node1.get('position').disconnect();
    assert(true, true, 'Disconnected N1-N2 Position');
    assert(node1.getOut('position').output.length, 0, 'N1 Position out is disconnected');
    assert(node2.getIn('position').input, null, 'N2 Position in is disconnected');

    // Verify connected sockets
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is wired up (in)');
    assert(node2.getIn('color').input, node1.getOut('color'), 'N2 Color is wired up (in)');
    assert(node2.getIn('matrix').input, node1.getOut('matrix'), 'N2 Matrix is wired up (in)');

    assert(node1.getOut('alpha').output.length, 1, 'N1 Alpha has one connection (out)');
    assert(node1.getOut('color').output.length, 1, 'N1 Color has one connection (out)');
    assert(node1.getOut('matrix').output.length, 1, 'N1 Matrix has one connection (out)');

    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is wired up (out)');
    assert(node2.getIn('color'), node1.getOut('color').output[0], 'N1 Color is wired up (out)');
    assert(node2.getIn('matrix'), node1.getOut('matrix').output[0], 'N1 Matrix is wired up (out)');

    // Disconnect from the in side
    node2.getIn('color').disconnect();
    assert(node1.getOut('color').output.length, 0, 'N1 Color out is disconnected');
    assert(node2.getIn('color').input, null, 'N2 Color in is disconnected');

    // Verify connected sockets
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is wired up (in)');
    assert(node2.getIn('matrix').input, node1.getOut('matrix'), 'N2 Matrix is wired up (in)');

    assert(node1.getOut('alpha').output.length, 1, 'N1 Alpha has one connection (out)');
    assert(node1.getOut('matrix').output.length, 1, 'N1 Matrix has one connection (out)');

    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is wired up (out)');
    assert(node2.getIn('matrix'), node1.getOut('matrix').output[0], 'N1 Matrix is wired up (out)');

    // Connect third node to first automatically.
    node1.connect(node3);
    assert(true, true, 'Connected Node 1 and Node 3');

    // Verify that existing connections to node2 are still ok.
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is still wired up (in)');
    assert(node2.getIn('matrix').input, node1.getOut('matrix'), 'N2 Matrix is still wired up (in)');

    assert(!!node1.getOut('alpha').output.length, true, 'N1 Alpha has at least one connection (out)');
    assert(node1.getOut('matrix').output.length, 1, 'N1 Matrix has one connection (out)');

    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is still wired up (out)');
    assert(node2.getIn('matrix'), node1.getOut('matrix').output[0], 'N1 Matrix is still wired up (out)');

    // Verify that third node is connected.
    assert(node3.getIn('alpha').input, node1.getOut('alpha'), 'N3 Alpha is wired up (in)');
    assert(node3.getIn('color').input, node1.getOut('color'), 'N3 Color is wired up (in)');
    assert(node3.getIn('position').input, node1.getOut('position'), 'N3 Position is wired up (in)');

    assert(node1.getOut('alpha').output.length, 2, 'N1 Alpha has two connections (out)');
    assert(node1.getOut('color').output.length, 1, 'N1 Color has one connection (out)');
    assert(node1.getOut('position').output.length, 1, 'N1 Position has one connection (out)');

    assert(node3.getIn('alpha'), node1.getOut('alpha').output[1], 'N1 Alpha is wired up (out)');
    assert(node3.getIn('color'), node1.getOut('color').output[0], 'N1 Color is wired up (out)');
    assert(node3.getIn('position'), node1.getOut('position').output[0], 'N1 Position is wired up (out)');

    // Change node 1 definition.
    // Existing outlets must remain connected for the test to pass.
    const def4 = [
      { // Alpha is unchanged
        inout: $.OUT,
        name: 'alpha',
        type: 'f',
      },
      { // Matrix has switched types
        inout: $.OUT,
        name: 'matrix',
        type: 'v3',
      },
      // Color out was dropped
      // Color in was kept
      {
        inout: $.IN,
        name: 'color',
        type: 'v3',
      },
      // Position was kept.
      {
        inout: $.OUT,
        name: 'position',
        type: 'v3',
      },
    ];
    node1.setOutlets(def4);
    assert(true, true, 'Changed Node 1 definition');


    // Verify that alpha connection to node2 was kept
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is still wired up (in)');
    assert(!!node1.getOut('alpha').output.length, true, 'N1 Alpha has at least one connection (out)');
    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is still wired up (out)');

    // Verify that matrix and color connections were dropped.
    assert(node2.getIn('matrix').input, null, 'N2 Matrix was disconnected (in)');

    assert(node3.getIn('color').input, null, 'N3 Color was disconnected (in)');

    assert(node1.getOut('matrix').output.length, 0, 'N1 Matrix output is not connected (out)');
    assert(node1.getOut('color'), undefined, 'N1 Color output has disappeared (out)');

    // Verify that alpha and position connections to node3 were kept
    assert(node3.getIn('alpha').input, node1.getOut('alpha'), 'N3 Alpha is still wired up (in)');
    assert(node3.getIn('position').input, node1.getOut('position'), 'N3 Position is still wired up (in)');

    assert(node1.getOut('alpha').output.length, 2, 'N1 Alpha has two connections (out)');
    assert(node1.getOut('position').output.length, 1, 'N1 Position has 1 connection (out)');

    assert(node3.getIn('alpha'), node1.getOut('alpha').output[1], 'N1 Alpha is still wired up (out)');
    assert(node3.getIn('position'), node1.getOut('position').output[0], 'N1 Position is still wired up (out)');

    // Verify color input is untouched
    assert(node1.getIn('color').input, null, 'N1 Color is ignored (in)');

    // Change node3 definition
    const def5 = [
      // Alpha was dropped.
      {
        inout: $.IN,
        name: 'color',
        type: 'v3',
      },
      {
        inout: $.IN,
        name: 'position',
        type: 'v3',
      },
      {
        inout: $.OUT,
        name: 'matrix',
        type: 'm4',
      },
    ];
    node3.setOutlets(def5);
    assert(true, true, 'Changed Node 3 definition');

    // Verify that alpha connection from node1 was dropped
    assert(node3.getIn('alpha'), undefined, 'N3 Alpha was dropped (in)');

    // Verify that alpha connection between node1 and node2 is unchanged
    assert(node2.getIn('alpha').input, node1.getOut('alpha'), 'N2 Alpha is still wired up (in)');
    assert(node1.getOut('alpha').output.length, 1, 'N1 Alpha has one connection (out)');
    assert(node2.getIn('alpha'), node1.getOut('alpha').output[0], 'N1 Alpha is still wired up (out)');

    // Verify that position connection between node1 and node3 is unchanged
    assert(node3.getIn('position').input, node1.getOut('position'), 'N3 Position is still wired up (in)');
    assert(node1.getOut('position').output.length, 1, 'N1 Position has one connection (out)');
    assert(node3.getIn('position'), node1.getOut('position').output[0], 'N1 Position is still wired up (out)');

    // Verify graph inputs/outputs
    graph.add(node1);
    graph.add(node2);
    graph.add(node3);

    const inputs = graph.inputs();
    assert(inputs.indexOf(node1.getIn('color'))    >= 0, true, 'Graph has N1 color input');
    assert(inputs.indexOf(node2.getIn('color'))    >= 0, true, 'Graph has N2 color input');
    assert(inputs.indexOf(node3.getIn('color'))    >= 0, true, 'Graph has N3 color input');
    assert(inputs.indexOf(node2.getIn('position')) >= 0, true, 'Graph has N2 position input');
    assert(inputs.indexOf(node2.getIn('matrix'))   >= 0, true, 'Graph has N2 matrix input');
    assert(inputs.length, 5, 'Graph has 5 inputs');

    const outputs = graph.outputs();
    assert(outputs.indexOf(node1.getOut('matrix'))        >= 0, true, 'Graph has N1 matrix output');
    assert(outputs.indexOf(node2.getOut('matrix'))        >= 0, true, 'Graph has N2 matrix output');
    assert(outputs.indexOf(node3.getOut('matrix'))        >= 0, true, 'Graph has N3 matrix output');
    return assert(outputs.length, 3, 'Graph has 3 outputs');
  });
});
