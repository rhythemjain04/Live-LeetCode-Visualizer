import { ExecutionStep, VisualizationNode, Variable, StackFrame, NodeState } from '@/store/visualizerStore';

// Parse input string to array of numbers
export function parseInput(input: string): number[] {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n));
}

// Generate execution steps for Bubble Sort
export function generateBubbleSortSteps(inputArray: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arr = [...inputArray];
  const n = arr.length;
  
  // Helper to create nodes from array
  const createNodes = (arr: number[], activeIndices: number[] = [], comparing: number[] = [], swapped: number[] = []): VisualizationNode[] => {
    return arr.map((value, index) => {
      let state: NodeState = 'default';
      if (swapped.includes(index)) state = 'swapping';
      else if (comparing.includes(index)) state = 'comparing';
      else if (activeIndices.includes(index)) state = 'active';
      
      return {
        id: `node-${index}`,
        value,
        state,
        x: 80 + index * 70,
        y: 150,
      };
    });
  };
  
  // Initial step
  steps.push({
    line: 1,
    code: 'function bubbleSort(arr) {',
    description: 'Starting bubble sort algorithm',
    nodes: createNodes(arr),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
      { name: 'n', value: n, type: 'number', changed: false },
    ],
    callStack: [{ functionName: 'bubbleSort', line: 1, variables: [] }],
    console: ['Starting Bubble Sort...'],
  });
  
  for (let i = 0; i < n - 1; i++) {
    steps.push({
      line: 3,
      code: `for (let i = 0; i < n - 1; i++) {`,
      description: `Outer loop: pass ${i + 1} of ${n - 1}`,
      nodes: createNodes(arr),
      variables: [
        { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
        { name: 'n', value: n, type: 'number', changed: false },
        { name: 'i', value: i, type: 'number', changed: i === 0 },
      ],
      callStack: [{ functionName: 'bubbleSort', line: 3, variables: [] }],
      console: [`Pass ${i + 1}/${n - 1}`],
    });
    
    for (let j = 0; j < n - i - 1; j++) {
      // Comparing step
      steps.push({
        line: 5,
        code: `if (arr[j] > arr[j + 1]) {`,
        description: `Comparing arr[${j}]=${arr[j]} with arr[${j + 1}]=${arr[j + 1]}`,
        nodes: createNodes(arr, [], [j, j + 1]),
        variables: [
          { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
          { name: 'i', value: i, type: 'number', changed: false },
          { name: 'j', value: j, type: 'number', changed: true },
          { name: `arr[${j}]`, value: arr[j], type: 'number', changed: false },
          { name: `arr[${j + 1}]`, value: arr[j + 1], type: 'number', changed: false },
        ],
        callStack: [{ functionName: 'bubbleSort', line: 5, variables: [] }],
        console: [`Comparing ${arr[j]} > ${arr[j + 1]}?`],
      });
      
      if (arr[j] > arr[j + 1]) {
        // Swap step
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        
        steps.push({
          line: 7,
          code: `let temp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = temp;`,
          description: `Swapping ${arr[j + 1]} and ${arr[j]}`,
          nodes: createNodes(arr, [], [], [j, j + 1]),
          variables: [
            { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: true },
            { name: 'temp', value: temp, type: 'number', changed: true },
            { name: `arr[${j}]`, value: arr[j], type: 'number', changed: true },
            { name: `arr[${j + 1}]`, value: arr[j + 1], type: 'number', changed: true },
          ],
          callStack: [{ functionName: 'bubbleSort', line: 7, variables: [] }],
          console: [`Swapped! Array: [${arr.join(', ')}]`],
        });
      }
    }
  }
  
  // Final step
  steps.push({
    line: 14,
    code: 'return arr;',
    description: 'Sorting complete!',
    nodes: createNodes(arr).map(node => ({ ...node, state: 'visited' as NodeState })),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
      { name: 'result', value: JSON.stringify(arr), type: 'Array', changed: true },
    ],
    callStack: [],
    console: [`✓ Sorted: [${arr.join(', ')}]`],
  });
  
  return steps;
}

// Generate execution steps for Remove Duplicates
export function generateRemoveDuplicatesSteps(inputArray: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arr = [...inputArray];
  const seen = new Set<number>();
  const result: number[] = [];

  const createNodes = (
    base: number[],
    activeIndex: number = -1,
    keptIndices: number[] = [],
    duplicateIndices: number[] = []
  ): VisualizationNode[] => {
    return base.map((value, index) => {
      let state: NodeState = 'default';
      if (duplicateIndices.includes(index)) state = 'swapping';
      else if (keptIndices.includes(index)) state = 'visited';
      else if (index === activeIndex) state = 'active';

      return {
        id: `node-${index}`,
        value,
        state,
        x: 80 + index * 70,
        y: 150,
      };
    });
  };

  // Initial step
  steps.push({
    line: 1,
    code: 'function removeDuplicates(arr) {',
    description: 'Starting removeDuplicates algorithm',
    nodes: createNodes(arr),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
      { name: 'seen', value: '[]', type: 'Set<number>', changed: false },
      { name: 'result', value: '[]', type: 'Array', changed: false },
    ],
    callStack: [{ functionName: 'removeDuplicates', line: 1, variables: [] }],
    console: ['Starting Remove Duplicates...'],
  });

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];

    // Step: visiting element
    steps.push({
      line: 3,
      code: 'for (let num of arr) {',
      description: `Visiting value ${value} at index ${i}`,
      nodes: createNodes(arr, i, [], []),
      variables: [
        { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
        { name: 'i', value: i, type: 'number', changed: true },
        { name: 'num', value, type: 'number', changed: true },
        { name: 'seen', value: JSON.stringify([...seen]), type: 'Set<number>', changed: false },
        { name: 'result', value: JSON.stringify(result), type: 'Array', changed: false },
      ],
      callStack: [{ functionName: 'removeDuplicates', line: 3, variables: [] }],
      console: [`Checking ${value} (index ${i})`],
    });

    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);

      // Step: keeping unique value
      steps.push({
        line: 5,
        code: 'if (!seen.has(num)) { seen.add(num); result.push(num); }',
        description: `${value} is unique so far, adding to result`,
        nodes: createNodes(arr, i, [i], []),
        variables: [
          { name: 'num', value, type: 'number', changed: false },
          { name: 'seen', value: JSON.stringify([...seen]), type: 'Set<number>', changed: true },
          { name: 'result', value: JSON.stringify(result), type: 'Array', changed: true },
        ],
        callStack: [{ functionName: 'removeDuplicates', line: 5, variables: [] }],
        console: [`Keeping ${value}. Result: [${result.join(', ')}]`],
      });
    } else {
      // Step: duplicate found
      steps.push({
        line: 7,
        code: 'else { /* duplicate */ }',
        description: `${value} already seen, skipping duplicate`,
        nodes: createNodes(arr, i, [], [i]),
        variables: [
          { name: 'num', value, type: 'number', changed: false },
          { name: 'seen', value: JSON.stringify([...seen]), type: 'Set<number>', changed: false },
          { name: 'result', value: JSON.stringify(result), type: 'Array', changed: false },
        ],
        callStack: [{ functionName: 'removeDuplicates', line: 7, variables: [] }],
        console: [`Duplicate ${value} skipped`],
      });
    }
  }

  // Final step
  steps.push({
    line: 10,
    code: 'return result;',
    description: 'All duplicates removed. Returning result.',
    nodes: createNodes(result).map(node => ({ ...node, state: 'visited' as NodeState })),
    variables: [
      { name: 'seen', value: JSON.stringify([...seen]), type: 'Set<number>', changed: false },
      { name: 'result', value: JSON.stringify(result), type: 'Array', changed: true },
    ],
    callStack: [],
    console: [`✓ Unique values: [${result.join(', ')}]`],
  });

  return steps;
}

// Generate Stack operations steps
export function generateStackSteps(): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const stack: number[] = [];
  
  const createNodes = (items: number[], activeIndex: number = -1): VisualizationNode[] => {
    return items.map((value, index) => ({
      id: `node-${index}`,
      value,
      state: index === activeIndex ? 'active' : (index === items.length - 1 ? 'visited' : 'default') as NodeState,
      x: 200,
      y: 280 - index * 50,
    }));
  };
  
  steps.push({
    line: 1,
    code: 'let stack = new Stack();',
    description: 'Creating empty stack',
    nodes: [],
    variables: [{ name: 'stack', value: '[]', type: 'Stack', changed: true }],
    callStack: [{ functionName: 'main', line: 1, variables: [] }],
    console: ['Created empty stack'],
  });
  
  // Push 10
  stack.push(10);
  steps.push({
    line: 2,
    code: 'stack.push(10);',
    description: 'Pushing 10 onto stack',
    nodes: createNodes([...stack], stack.length - 1),
    variables: [
      { name: 'stack', value: JSON.stringify(stack), type: 'Stack', changed: true },
      { name: 'top', value: 10, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'push', line: 2, variables: [] }],
    console: ['Pushed: 10'],
  });
  
  // Push 20
  stack.push(20);
  steps.push({
    line: 3,
    code: 'stack.push(20);',
    description: 'Pushing 20 onto stack',
    nodes: createNodes([...stack], stack.length - 1),
    variables: [
      { name: 'stack', value: JSON.stringify(stack), type: 'Stack', changed: true },
      { name: 'top', value: 20, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'push', line: 3, variables: [] }],
    console: ['Pushed: 20'],
  });
  
  // Push 30
  stack.push(30);
  steps.push({
    line: 4,
    code: 'stack.push(30);',
    description: 'Pushing 30 onto stack',
    nodes: createNodes([...stack], stack.length - 1),
    variables: [
      { name: 'stack', value: JSON.stringify(stack), type: 'Stack', changed: true },
      { name: 'top', value: 30, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'push', line: 4, variables: [] }],
    console: ['Pushed: 30'],
  });
  
  // Pop
  const popped = stack.pop()!;
  steps.push({
    line: 5,
    code: 'stack.pop();',
    description: `Popped ${popped} from stack`,
    nodes: createNodes([...stack]),
    variables: [
      { name: 'stack', value: JSON.stringify(stack), type: 'Stack', changed: true },
      { name: 'popped', value: popped, type: 'number', changed: true },
      { name: 'top', value: stack[stack.length - 1] || 'empty', type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'pop', line: 5, variables: [] }],
    console: [`Popped: ${popped}`],
  });
  
  // Push 40
  stack.push(40);
  steps.push({
    line: 6,
    code: 'stack.push(40);',
    description: 'Pushing 40 onto stack',
    nodes: createNodes([...stack], stack.length - 1),
    variables: [
      { name: 'stack', value: JSON.stringify(stack), type: 'Stack', changed: true },
      { name: 'top', value: 40, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'push', line: 6, variables: [] }],
    console: ['Pushed: 40', `✓ Final stack: [${stack.join(', ')}]`],
  });
  
  return steps;
}

// Generate Queue operations steps
export function generateQueueSteps(): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const queue: number[] = [];
  
  const createNodes = (items: number[], activeIndex: number = -1, isDequeue: boolean = false): VisualizationNode[] => {
    return items.map((value, index) => ({
      id: `node-${index}`,
      value,
      state: (isDequeue && index === 0) ? 'comparing' : (index === activeIndex ? 'active' : 'default') as NodeState,
      x: 80 + index * 70,
      y: 150,
    }));
  };
  
  steps.push({
    line: 1,
    code: 'let queue = new Queue();',
    description: 'Creating empty queue',
    nodes: [],
    variables: [{ name: 'queue', value: '[]', type: 'Queue', changed: true }],
    callStack: [{ functionName: 'main', line: 1, variables: [] }],
    console: ['Created empty queue'],
  });
  
  // Enqueue operations
  [10, 20, 30].forEach((val, i) => {
    queue.push(val);
    steps.push({
      line: i + 2,
      code: `queue.enqueue(${val});`,
      description: `Enqueuing ${val} to back of queue`,
      nodes: createNodes([...queue], queue.length - 1),
      variables: [
        { name: 'queue', value: JSON.stringify(queue), type: 'Queue', changed: true },
        { name: 'front', value: queue[0], type: 'number', changed: i === 0 },
        { name: 'back', value: val, type: 'number', changed: true },
      ],
      callStack: [{ functionName: 'enqueue', line: i + 2, variables: [] }],
      console: [`Enqueued: ${val}`],
    });
  });
  
  // Dequeue
  const dequeued = queue.shift()!;
  steps.push({
    line: 5,
    code: 'queue.dequeue();',
    description: `Dequeued ${dequeued} from front`,
    nodes: createNodes([...queue]),
    variables: [
      { name: 'queue', value: JSON.stringify(queue), type: 'Queue', changed: true },
      { name: 'dequeued', value: dequeued, type: 'number', changed: true },
      { name: 'front', value: queue[0], type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'dequeue', line: 5, variables: [] }],
    console: [`Dequeued: ${dequeued}`],
  });
  
  // Enqueue 40
  queue.push(40);
  steps.push({
    line: 6,
    code: 'queue.enqueue(40);',
    description: 'Enqueuing 40 to back of queue',
    nodes: createNodes([...queue], queue.length - 1),
    variables: [
      { name: 'queue', value: JSON.stringify(queue), type: 'Queue', changed: true },
      { name: 'front', value: queue[0], type: 'number', changed: false },
      { name: 'back', value: 40, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'enqueue', line: 6, variables: [] }],
    console: ['Enqueued: 40', `✓ Final queue: [${queue.join(', ')}]`],
  });
  
  return steps;
}

// Generate BST insertion steps
export function generateBSTSteps(): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const values = [50, 30, 70, 20, 40, 60, 80];
  
  interface TreeNode {
    id: string;
    value: number;
    left: string | null;
    right: string | null;
    x: number;
    y: number;
    state: NodeState;
  }
  
  const nodes: Map<number, TreeNode> = new Map();
  let nodeId = 0;
  
  const getTreeLayout = (val: number, parent: number | null, isLeft: boolean, depth: number): { x: number; y: number } => {
    const baseX = 300;
    const baseY = 60;
    const ySpacing = 70;
    const xSpacing = 180 / Math.pow(2, depth);
    
    if (parent === null) {
      return { x: baseX, y: baseY };
    }
    
    const parentNode = nodes.get(parent);
    if (parentNode) {
      return {
        x: parentNode.x + (isLeft ? -xSpacing : xSpacing),
        y: baseY + depth * ySpacing,
      };
    }
    return { x: baseX, y: baseY };
  };
  
  const createVisualizationNodes = (): VisualizationNode[] => {
    return Array.from(nodes.values()).map(n => ({
      id: n.id,
      value: n.value,
      state: n.state,
      x: n.x,
      y: n.y,
      left: n.left,
      right: n.right,
    }));
  };
  
  steps.push({
    line: 1,
    code: 'let bst = new BST();',
    description: 'Creating empty Binary Search Tree',
    nodes: [],
    variables: [{ name: 'bst.root', value: 'null', type: 'TreeNode', changed: true }],
    callStack: [{ functionName: 'main', line: 1, variables: [] }],
    console: ['Created empty BST'],
  });
  
  let root: number | null = null;
  
  values.forEach((val, i) => {
    const id = `node-${nodeId++}`;
    
    if (root === null) {
      const pos = getTreeLayout(val, null, false, 0);
      nodes.set(val, { id, value: val, left: null, right: null, ...pos, state: 'active' });
      root = val;
      
      steps.push({
        line: 5,
        code: `bst.insert(${val});`,
        description: `Inserting ${val} as root`,
        nodes: createVisualizationNodes(),
        variables: [
          { name: 'newNode.value', value: val, type: 'number', changed: true },
          { name: 'bst.root', value: val, type: 'TreeNode', changed: true },
        ],
        callStack: [{ functionName: 'insert', line: 5, variables: [] }],
        console: [`Root: ${val}`],
      });
      
      // Reset state
      nodes.get(val)!.state = 'default';
    } else {
      let current = root;
      let parent: number | null = null;
      let isLeft = false;
      let depth = 1;
      
      // Traverse to find insertion point
      while (current !== null) {
        const currentNode = nodes.get(current);
        if (currentNode) {
          currentNode.state = 'comparing';
        }
        
        steps.push({
          line: 10,
          code: val < current ? 'current = current.left;' : 'current = current.right;',
          description: `Comparing ${val} with ${current}: go ${val < current ? 'left' : 'right'}`,
          nodes: createVisualizationNodes(),
          variables: [
            { name: 'current.value', value: current, type: 'number', changed: true },
            { name: 'newValue', value: val, type: 'number', changed: false },
            { name: 'direction', value: val < current ? 'left' : 'right', type: 'string', changed: true },
          ],
          callStack: [{ functionName: 'insert', line: 10, variables: [] }],
          console: [`${val} ${val < current ? '<' : '>='} ${current}, go ${val < current ? 'left' : 'right'}`],
        });
        
        if (currentNode) {
          currentNode.state = 'visited';
        }
        
        parent = current;
        isLeft = val < current;
        
        if (isLeft) {
          const leftNode = nodes.get(current);
          if (leftNode?.left) {
            const leftChild = Array.from(nodes.values()).find(n => n.id === leftNode.left);
            current = leftChild?.value || null as any;
          } else {
            current = null as any;
          }
        } else {
          const rightNode = nodes.get(current);
          if (rightNode?.right) {
            const rightChild = Array.from(nodes.values()).find(n => n.id === rightNode.right);
            current = rightChild?.value || null as any;
          } else {
            current = null as any;
          }
        }
        depth++;
      }
      
      // Insert new node
      const pos = getTreeLayout(val, parent, isLeft, depth - 1);
      nodes.set(val, { id, value: val, left: null, right: null, ...pos, state: 'active' });
      
      // Update parent's reference
      if (parent !== null) {
        const parentNode = nodes.get(parent);
        if (parentNode) {
          if (isLeft) {
            parentNode.left = id;
          } else {
            parentNode.right = id;
          }
        }
      }
      
      steps.push({
        line: 15,
        code: `${isLeft ? 'current.left' : 'current.right'} = newNode;`,
        description: `Inserted ${val} as ${isLeft ? 'left' : 'right'} child of ${parent}`,
        nodes: createVisualizationNodes(),
        variables: [
          { name: 'newNode.value', value: val, type: 'number', changed: true },
          { name: 'parent.value', value: parent, type: 'number', changed: false },
          { name: 'position', value: isLeft ? 'left' : 'right', type: 'string', changed: true },
        ],
        callStack: [{ functionName: 'insert', line: 15, variables: [] }],
        console: [`${val} → ${isLeft ? 'left' : 'right'} of ${parent}`],
      });
      
      // Reset all states
      nodes.forEach(n => n.state = 'default');
    }
  });
  
  // Final step
  steps.push({
    line: 20,
    code: '// BST construction complete',
    description: 'Binary Search Tree construction complete!',
    nodes: createVisualizationNodes().map(n => ({ ...n, state: 'visited' as NodeState })),
    variables: [
      { name: 'bst.size', value: values.length, type: 'number', changed: false },
      { name: 'bst.height', value: 3, type: 'number', changed: false },
    ],
    callStack: [],
    console: [`✓ BST built with ${values.length} nodes`],
  });
  
  return steps;
}

// Generate Binary Search steps
export function generateBinarySearchSteps(inputArray: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arr = [...inputArray].sort((a, b) => a - b);
  const target = arr[Math.floor(arr.length * 0.6)]; // Pick a target that exists
  
  const createNodes = (arr: number[], left: number, right: number, mid: number): VisualizationNode[] => {
    return arr.map((value, index) => {
      let state: NodeState = 'default';
      if (index === mid) state = 'active';
      else if (index >= left && index <= right) state = 'comparing';
      else state = 'visited';
      
      return {
        id: `node-${index}`,
        value,
        state,
        x: 50 + index * 65,
        y: 150,
      };
    });
  };
  
  let left = 0;
  let right = arr.length - 1;
  
  steps.push({
    line: 1,
    code: `binarySearch(arr, ${target})`,
    description: `Searching for ${target} in sorted array`,
    nodes: createNodes(arr, left, right, -1),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
      { name: 'target', value: target, type: 'number', changed: false },
      { name: 'left', value: left, type: 'number', changed: true },
      { name: 'right', value: right, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'binarySearch', line: 1, variables: [] }],
    console: [`Searching for ${target} in [${arr.join(', ')}]`],
  });
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    steps.push({
      line: 5,
      code: `let mid = Math.floor((left + right) / 2);`,
      description: `Checking middle index ${mid}: value = ${arr[mid]}`,
      nodes: createNodes(arr, left, right, mid),
      variables: [
        { name: 'left', value: left, type: 'number', changed: false },
        { name: 'right', value: right, type: 'number', changed: false },
        { name: 'mid', value: mid, type: 'number', changed: true },
        { name: 'arr[mid]', value: arr[mid], type: 'number', changed: true },
      ],
      callStack: [{ functionName: 'binarySearch', line: 5, variables: [] }],
      console: [`Checking index ${mid}: ${arr[mid]}`],
    });
    
    if (arr[mid] === target) {
      steps.push({
        line: 8,
        code: `return mid; // Found!`,
        description: `Found ${target} at index ${mid}!`,
        nodes: createNodes(arr, mid, mid, mid).map((n, i) => ({
          ...n,
          state: i === mid ? 'found' as NodeState : 'visited' as NodeState,
        })),
        variables: [
          { name: 'result', value: mid, type: 'number', changed: true },
          { name: 'found', value: true, type: 'boolean', changed: true },
        ],
        callStack: [],
        console: [`✓ Found ${target} at index ${mid}!`],
      });
      return steps;
    }
    
    if (arr[mid] < target) {
      steps.push({
        line: 12,
        code: `left = mid + 1;`,
        description: `${arr[mid]} < ${target}, search right half`,
        nodes: createNodes(arr, mid + 1, right, mid),
        variables: [
          { name: 'left', value: mid + 1, type: 'number', changed: true },
          { name: 'right', value: right, type: 'number', changed: false },
        ],
        callStack: [{ functionName: 'binarySearch', line: 12, variables: [] }],
        console: [`${arr[mid]} < ${target}, moving left to ${mid + 1}`],
      });
      left = mid + 1;
    } else {
      steps.push({
        line: 14,
        code: `right = mid - 1;`,
        description: `${arr[mid]} > ${target}, search left half`,
        nodes: createNodes(arr, left, mid - 1, mid),
        variables: [
          { name: 'left', value: left, type: 'number', changed: false },
          { name: 'right', value: mid - 1, type: 'number', changed: true },
        ],
        callStack: [{ functionName: 'binarySearch', line: 14, variables: [] }],
        console: [`${arr[mid]} > ${target}, moving right to ${mid - 1}`],
      });
      right = mid - 1;
    }
  }
  
  return steps;
}

// Generate steps for segregating 0s and 1s using two pointers
export function generateSegregate01Steps(inputArray: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arr = [...inputArray];
  let a = 0;
  let b = arr.length - 1;

  const createNodes = (
    values: number[],
    idxA: number,
    idxB: number,
    swapped: boolean
  ): VisualizationNode[] =>
    values.map((value, index) => {
      let state: NodeState = 'default';
      if (index === idxA || index === idxB) {
        state = swapped ? 'swapping' : 'active';
      } else if (value === 1) {
        state = 'visited';
      }
      return {
        id: `node-${index}`,
        value,
        state,
        x: 80 + index * 70,
        y: 150,
      };
    });

  // Initial state
  steps.push({
    line: 1,
    code: 'void segregate0and1(int[] arr) {',
    description: 'Start segregating 0s and 1s',
    nodes: createNodes(arr, -1, -1, false),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: false },
      { name: 'a', value: a, type: 'number', changed: true },
      { name: 'b', value: b, type: 'number', changed: true },
    ],
    callStack: [{ functionName: 'segregate0and1', line: 1, variables: [] }],
    console: ['Starting segregate0and1'],
  });

  while (a < b) {
    const consoleMsgs: string[] = [];

    // Visit current pair
    steps.push({
      line: 6,
      code: 'while (a < b) { ... }',
      description: `Checking pair (a=${a}, b=${b}) with values (${arr[a]}, ${arr[b]})`,
      nodes: createNodes(arr, a, b, false),
      variables: [
        { name: 'a', value: a, type: 'number', changed: true },
        { name: 'b', value: b, type: 'number', changed: true },
        { name: `arr[a]`, value: arr[a], type: 'number', changed: false },
        { name: `arr[b]`, value: arr[b], type: 'number', changed: false },
      ],
      callStack: [{ functionName: 'segregate0and1', line: 6, variables: [] }],
      console: [`At a=${a}, b=${b} -> (${arr[a]}, ${arr[b]})`],
    });

    if (arr[a] === 1 && arr[b] === 0) {
      const beforeA = a;
      const beforeB = b;
      const temp = arr[a];
      arr[a] = arr[b];
      arr[b] = temp;
      a++;
      b--;
      consoleMsgs.push(`Swap: arr[${beforeA}] and arr[${beforeB}] -> [${arr.join(', ')}]`);

      steps.push({
        line: 9,
        code: 'swap(arr, a, b); a++; b--;',
        description: `Swapped 1 on left with 0 on right`,
        nodes: createNodes(arr, beforeA, beforeB, true),
        variables: [
          { name: 'a', value: a, type: 'number', changed: true },
          { name: 'b', value: b, type: 'number', changed: true },
          { name: `arr`, value: JSON.stringify(arr), type: 'Array', changed: true },
        ],
        callStack: [{ functionName: 'segregate0and1', line: 9, variables: [] }],
        console: consoleMsgs,
      });
      continue;
    }

    if (arr[a] === 1 && arr[b] !== 0) {
      b--;
      consoleMsgs.push(`Move b left to ${b} (arr[a]=1, arr[b]!=0)`);

      steps.push({
        line: 13,
        code: 'if (arr[a] == 1 && arr[b] != 0) { b--; }',
        description: 'Move right pointer left because left is 1 and right is not 0',
        nodes: createNodes(arr, a, b, false),
        variables: [
          { name: 'a', value: a, type: 'number', changed: false },
          { name: 'b', value: b, type: 'number', changed: true },
        ],
        callStack: [{ functionName: 'segregate0and1', line: 13, variables: [] }],
        console: consoleMsgs,
      });
      continue;
    }

    if (arr[a] !== 1 && arr[b] === 0) {
      a++;
      consoleMsgs.push(`Move a right to ${a} (arr[a]!=1, arr[b]==0)`);

      steps.push({
        line: 16,
        code: 'if (arr[a] != 1 && arr[b] == 0) { a++; }',
        description: 'Move left pointer right because left is 0 and right is 0',
        nodes: createNodes(arr, a, b, false),
        variables: [
          { name: 'a', value: a, type: 'number', changed: true },
          { name: 'b', value: b, type: 'number', changed: false },
        ],
        callStack: [{ functionName: 'segregate0and1', line: 16, variables: [] }],
        console: consoleMsgs,
      });
      continue;
    }

    if (arr[a] === 0 && arr[b] === 1) {
      a++;
      b--;
      consoleMsgs.push(`Both sides already correct (0 on left, 1 on right). Move both pointers.`);

      steps.push({
        line: 19,
        code: 'if (arr[a] == 0 && arr[b] == 1) { a++; b--; }',
        description: 'Both elements are already in correct positions; move both pointers',
        nodes: createNodes(arr, a, b, false),
        variables: [
          { name: 'a', value: a, type: 'number', changed: true },
          { name: 'b', value: b, type: 'number', changed: true },
        ],
        callStack: [{ functionName: 'segregate0and1', line: 19, variables: [] }],
        console: consoleMsgs,
      });
    } else {
      // Fallback, just move pointers to avoid infinite loops
      a++;
      b--;
    }
  }

  // Final step
  steps.push({
    line: 0,
    code: 'return;',
    description: 'Segregation complete',
    nodes: createNodes(arr, -1, -1, false).map((n) => ({ ...n, state: 'visited' as NodeState })),
    variables: [
      { name: 'arr', value: JSON.stringify(arr), type: 'Array', changed: true },
    ],
    callStack: [],
    console: [`✓ Segregated array: [${arr.join(', ')}]`],
  });

  return steps;
}
