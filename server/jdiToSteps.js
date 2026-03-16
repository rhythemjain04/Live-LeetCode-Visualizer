/**
 * Convert JDI JSON events (from java-debug-controller) into ExecutionStep[]
 * that the frontend can render.
 */

function valueType(v) {
  if (Array.isArray(v)) return 'Array';
  if (v === null) return 'null';
  return typeof v;
}

function stringify(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Format a variable value for display in the variables panel.
 * Converts arrays to "[1, 2, 3]" format,
 * and strips residual "Object(X)" strings if we have a better value from structures.
 */
function formatDisplayValue(value, varName, structures) {
  if (value === null || value === undefined) return null;

  // If it's an array (from direct field extraction in DebugController) — format it nicely
  if (Array.isArray(value)) {
    const inner = value.map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v)).join(', ');
    return `[${inner}]`;
  }

  // If it looks like "Object(...)" — try to find actual value in structures
  if (typeof value === 'string' && value.startsWith('Object(')) {
    if (Array.isArray(structures)) {
      const matching = structures.find(s => s && s.name === varName);
      if (matching && Array.isArray(matching.values) && matching.values.length > 0) {
        const inner = matching.values.map(v => String(v)).join(', ');
        return `[${inner}]`;
      }
    }
    // At least clean it up: "Object(java.util.ArrayDeque)" → "<ArrayDeque>"
    const match = value.match(/Object\((?:java\.util\.)?(\w+)\)/);
    if (match) return `<${match[1]}>`;
    return value;
  }

  return value;
}

function buildNodes(ds, values, vars) {
  // Handle graphs specially
  if (ds === 'graph') {
    return buildGraphNodes(values, vars);
  }

  // Handle hash tables specially
  if (ds === 'hashTable') {
    return buildHashTableNodes(values, vars);
  }

  // Handle heap specially
  if (ds === 'heap') {
    const nodes = [];
    
    if (Array.isArray(values)) {
      for (let i = 0; i < values.length; i++) {
        nodes.push({
          id: `heap-node-${i}`,
          value: values[i],
          state: 'default',
          x: 300 + (i % 2 === 0 ? -1 : 1) * (100 - Math.floor(Math.log2(i + 1)) * 20),
          y: 50 + Math.floor(Math.log2(i + 1)) * 80,
          left: i * 2 + 1 < values.length ? `heap-node-${i * 2 + 1}` : null,
          right: i * 2 + 2 < values.length ? `heap-node-${i * 2 + 2}` : null,
        });
      }
    }
    
    // Highlight heap operations
    if (vars && typeof vars === 'object') {
      const heapVars = ['parent', 'child', 'current', 'root'];
      for (const key of heapVars) {
        const idx = vars[key];
        if (typeof idx === 'number' && idx >= 0 && idx < nodes.length) {
          nodes[idx].state = 'active';
        }
      }
    }
    
    return nodes;
  }

  // Handle 2D arrays specially
  if (ds === 'array' && values.length > 0 && Array.isArray(values[0])) {
    // 2D array - flatten it for visualization
    const flatNodes = [];
    let nodeIndex = 0;
    for (let row = 0; row < values.length; row++) {
      for (let col = 0; col < values[row].length; col++) {
        flatNodes.push({
          id: `${ds}-node-${row}-${col}`,
          value: values[row][col],
          state: 'default',
          x: 80 + col * 70,
          y: 100 + row * 80,
        });
        nodeIndex++;
      }
    }
    
    // Highlight pointer variables for 2D arrays
    if (vars && typeof vars === 'object') {
      const pointerVars = ['i', 'j', 'row', 'col', 'x', 'y'];
      for (const key of pointerVars) {
        const ptr = vars[key];
        if (typeof ptr === 'number' && ptr >= 0 && ptr < values.length) {
          for (let col = 0; col < values[ptr].length; col++) {
            const nodeIndex = ptr * values[ptr].length + col;
            if (flatNodes[nodeIndex]) {
              flatNodes[nodeIndex].state = 'active';
            }
          }
        }
      }
    }
    
    return flatNodes;
  }

  // Handle linked list specially
  if (ds === 'linkedList') {
    const nodes = [];
    // values should be an array of objects with value, next, prev properties
    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      const node = {
        id: `linkedlist-node-${i}`,
        value: typeof item === 'object' ? (item.value || item.val || item.data || i) : (item || i),
        state: 'default',
        x: 100 + i * 120,
        y: 150,
      };
      
      if (typeof item === 'object' && item !== null) {
        if (item.next !== undefined) node.next = item.next;
        if (item.prev !== undefined) node.prev = item.prev;
      }

      if (node.next === undefined && i < values.length - 1) {
        node.next = `linkedlist-node-${i + 1}`;
      }
      
      nodes.push(node);
    }
    
    // Highlight pointer variables for linked lists
    if (vars && typeof vars === 'object') {
      const pointerVars = ['head', 'tail', 'current', 'slow', 'fast', 'prev', 'next'];
      for (const key of pointerVars) {
        const ptr = vars[key];
        if (typeof ptr === 'number' && ptr >= 0 && ptr < nodes.length) {
          nodes[ptr].state = 'active';
        }
      }
    }
    
    return nodes;
  }

  // Original logic for other data structures (array, stack, queue)
  const nodes = (values || []).map((value, index) => ({
    id: `${ds}-node-${index}`,
    value: typeof value === 'number' ? value : String(value),
    state: 'default',
    x: ds === 'stack' ? 200 : 80 + index * 70,
    y: ds === 'stack' ? 280 - index * 50 : 150,
  }));

  // Highlight pointer-like indices for arrays/queues
  if ((ds === 'array' || ds === 'queue') && vars && typeof vars === 'object') {
    const maybeIdx = ['a', 'b', 'i', 'j', 'left', 'right', 'mid', 'front', 'back'];
    for (const key of maybeIdx) {
      const idx = vars[key];
      if (typeof idx === 'number' && idx >= 0 && idx < nodes.length) {
        nodes[idx].state = nodes[idx].state === 'default' ? 'active' : nodes[idx].state;
      }
    }
  }

  return nodes;
}

function buildGraphNodes(values, vars) {
  const nodes = [];
  
  if (Array.isArray(values)) {
    if (values.length > 0 && Array.isArray(values[0])) {
      const size = values.length;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < values[i].length; j++) {
          if (values[i][j] !== 0 && values[i][j] !== null && values[i][j] !== undefined) {
            nodes.push({
              id: `graph-node-${i}-${j}`,
              value: `${i}->${j}`,
              state: 'default',
              x: 100 + j * 80,
              y: 100 + i * 80,
            });
          }
        }
      }
    } else {
      for (let i = 0; i < values.length; i++) {
        const item = values[i];
        nodes.push({
          id: `graph-node-${i}`,
          value: typeof item === 'object' ? (item.value || item.id || i) : item,
          state: 'default',
          x: 100 + (i % 5) * 120,
          y: 100 + Math.floor(i / 5) * 120,
        });
      }
    }
  }
  
  if (vars && typeof vars === 'object') {
    const visitedVars = ['visited', 'current', 'start', 'end', 'source', 'target'];
    for (const key of visitedVars) {
      const visited = vars[key];
      if (Array.isArray(visited)) {
        visited.forEach(idx => {
          if (typeof idx === 'number' && idx < nodes.length) {
            nodes[idx].state = 'visited';
          }
        });
      }
    }
  }
  
  return nodes;
}

function buildHashTableNodes(values, vars) {
  const nodes = [];
  
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      let displayValue = '';
      let key = '';
      
      if (typeof item === 'object' && item !== null) {
        displayValue = item.value || item.val || item.data || 'null';
        key = item.key || item.k || i;
      } else {
        // Could be "k=v" strings from HashMap extraction
        displayValue = item || 'null';
        key = i;
      }
      
      nodes.push({
        id: `hash-node-${i}`,
        value: typeof item === 'string' && item.includes('=') ? item : `${key}:${displayValue}`,
        state: 'default',
        x: 80 + (i % 6) * 90,
        y: 100 + Math.floor(i / 6) * 80,
      });
    }
  }
  
  if (vars && typeof vars === 'object') {
    const hashVars = ['hash', 'index', 'bucket', 'slot'];
    for (const key of hashVars) {
      const idx = vars[key];
      if (typeof idx === 'number' && idx >= 0 && idx < nodes.length) {
        nodes[idx].state = 'active';
      }
    }
  }
  
  return nodes;
}

function buildLinkedListNodesFromMap(nodeMap, headId, vars) {
  const nodes = [];
  const processedIds = new Set();
  
  let currentId = headId;
  let index = 0;
  
  while (currentId && nodeMap[currentId] && !processedIds.has(currentId)) {
    processedIds.add(currentId);
    const nodeData = nodeMap[currentId];
    
    nodes.push({
      id: String(currentId),
      value: typeof nodeData.val === 'object' ? JSON.stringify(nodeData.val) : nodeData.val,
      next: nodeData.next ? String(nodeData.next) : null,
      state: 'default',
      x: 100 + index * 150,
      y: 150
    });
    
    currentId = nodeData.next;
    index++;
  }
  
  for (const [id, data] of Object.entries(nodeMap)) {
    if (!processedIds.has(id)) {
      processedIds.add(id);
      nodes.push({
        id: String(id),
        value: typeof data.val === 'object' ? JSON.stringify(data.val) : data.val,
        next: data.next ? String(data.next) : null,
        state: 'default',
        x: 100 + index * 150,
        y: 150 + (index % 2) * 20
      });
      index++;
    }
  }

  if (vars && typeof vars === 'object') {
    const pointerVars = ['head', 'tail', 'current', 'slow', 'fast', 'prev', 'next'];
    for (const key of pointerVars) {
      const variable = vars[key];
      if (variable && typeof variable === 'object' && variable['@id']) {
        const targetId = String(variable['@id']);
        const node = nodes.find(n => n.id === targetId);
        if (node) {
          node.state = 'active';
          node.pointers = node.pointers || [];
          node.pointers.push(key);
        }
      }
    }
  }
  
  return nodes;
}

export function jdiEventsToExecutionSteps(events, javaStdoutLines = [], javaStderrLines = []) {
  const steps = [];
  let prevVars = {};

  for (let k = 0; k < events.length; k++) {
    const ev = events[k] || {};
    const vars = ev.vars || {};
    const rawStructures = Array.isArray(ev.structures) ? ev.structures : [];

    const variables = Object.entries(vars).map(([name, value]) => {
      const prev = prevVars[name];
      const changed = stringify(prev) !== stringify(value);

      // Format value for display — arrays from field-access show as "[1, 2, 3]"
      const displayValue = formatDisplayValue(value, name, rawStructures);

      return {
        name,
        value: displayValue !== null ? displayValue : value,
        type: valueType(value),
        changed
      };
    });

    const visualizations = rawStructures
      .filter((s) => s && s.kind && (s.values || s.nodes))
      .map((s) => {
        const kind = String(s.kind);
        const ds =
          kind === 'stack' ? 'stack' :
          kind === 'queue' ? 'queue' :
          kind === 'bst' ? 'bst' :
          kind === 'linkedlist' ? 'linkedList' :
          kind === 'tree' ? 'bst' :
          kind === 'graph' ? 'graph' :
          kind === 'hashmap' ? 'hashTable' :
          kind === 'hashset' ? 'hashTable' :
          kind === 'hashTable' ? 'hashTable' :
          kind === 'heap' ? 'heap' :
          kind === '2darray' ? 'array' :
          'array';
        
        // Handle Linked List structure (Map of nodes from snapshotLinkedList)
        if (ds === 'linkedList' && s.nodes && !Array.isArray(s.nodes)) {
           return {
             title: s.name ? `${s.name}` : undefined,
             dataStructure: ds,
             nodes: buildLinkedListNodesFromMap(s.nodes, s.head, vars),
           };
        }

        // Ensure values is an array
        let values = [];
        if (Array.isArray(s.values)) {
          values = s.values;
        } else if (s.values !== null && s.values !== undefined) {
          values = [s.values];
        }
        
        // Debug logging (first and last step only)
        if (k === 0 || k === events.length - 1) {
          console.log(`[jdiToSteps] Structure ${s.name}: kind=${kind}, ds=${ds}, values.length=${values.length}`);
        }
        
        return {
          title: s.name ? `${s.name}` : undefined,
          dataStructure: ds,
          nodes: buildNodes(ds, values, vars),
        };
      });

    const primaryViz = visualizations[0];

    const callStack = Array.isArray(ev.callStack)
      ? ev.callStack.map((f) => ({
          functionName: f.functionName || 'fn',
          line: typeof f.line === 'number' ? f.line : 0,
          variables: [],
        }))
      : [];

    const consoleMsgs = [];
    if (ev.file && ev.line) consoleMsgs.push(`Executing ${ev.file}:${ev.line}`);
    if (ev.type) consoleMsgs.push(String(ev.type));

    steps.push({
      line: typeof ev.line === 'number' ? ev.line : 0,
      code: '',
      description: ev.file && ev.line ? `${ev.file}:${ev.line}` : 'Step',
      nodes: primaryViz?.nodes || [],
      edges: primaryViz?.edges || [],
      visualizations,
      variables,
      callStack,
      console: consoleMsgs,
    });

    prevVars = { ...vars };
  }

  // Attach actual Java stdout/stderr to the last step
  const filteredStdout = (javaStdoutLines || []).filter(line => 
    !line.includes('Listening for transport dt_socket') &&
    !line.includes('JDWP') &&
    line.trim().length > 0
  );
  const filteredStderr = (javaStderrLines || []).filter(line => 
    !line.includes('JDWP') &&
    line.trim().length > 0
  );

  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    const extra = [];
    if (filteredStdout.length) {
      extra.push('--- stdout ---', ...filteredStdout);
    }
    if (filteredStderr.length) {
      extra.push('--- stderr ---', ...filteredStderr);
    }
    if (extra.length) last.console = [...(last.console || []), ...extra];
  }

  if (steps.length === 0) {
    const consoleMsgs = [];
    if (filteredStdout.length) consoleMsgs.push('--- stdout ---', ...filteredStdout);
    if (filteredStderr.length) consoleMsgs.push('--- stderr ---', ...filteredStderr);
    steps.push({
      line: 0,
      code: '',
      description: 'No trace events from Java',
      nodes: [],
      variables: [],
      callStack: [],
      console: consoleMsgs.length ? consoleMsgs : ['No trace events from Java'],
    });
  }

  return steps;
}
