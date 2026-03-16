import { DataStructureType, ProgrammingLanguage } from '@/store/visualizerStore';

export interface CodeSnippet {
  id: string;
  name: string;
  category: string;
  code: string;
  language: ProgrammingLanguage;
  dataStructure: DataStructureType;
  description: string;
}

export const codeSnippets: CodeSnippet[] = [
  // Java Snippets (Primary)
  {
    id: 'java-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    language: 'java',
    dataStructure: 'array',
    description: 'Sort array using bubble sort algorithm',
    code: `// Bubble Sort Algorithm in Java
public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                // Compare adjacent elements
                if (arr[j] > arr[j + 1]) {
                    // Swap elements
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
    }
}`,
  },
  {
    id: 'java-stack',
    name: 'Stack Operations',
    category: 'Stack',
    language: 'java',
    dataStructure: 'stack',
    description: 'Demonstrate stack push and pop operations',
    code: `// Stack Operations in Java
import java.util.Stack;

public class StackDemo {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        
        // Push elements
        stack.push(10);
        System.out.println("Pushed: 10");
        
        stack.push(20);
        System.out.println("Pushed: 20");
        
        stack.push(30);
        System.out.println("Pushed: 30");
        
        // Pop element
        int popped = stack.pop();
        System.out.println("Popped: " + popped);
        
        // Push another element
        stack.push(40);
        System.out.println("Pushed: 40");
        
        // Peek top element
        System.out.println("Top: " + stack.peek());
    }
}`,
  },
  {
    id: 'java-queue',
    name: 'Queue Operations',
    category: 'Queue',
    language: 'java',
    dataStructure: 'queue',
    description: 'Demonstrate queue enqueue and dequeue',
    code: `// Queue Operations in Java
import java.util.LinkedList;
import java.util.Queue;

public class QueueDemo {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();
        
        // Enqueue elements
        queue.offer(10);
        System.out.println("Enqueued: 10");
        
        queue.offer(20);
        System.out.println("Enqueued: 20");
        
        queue.offer(30);
        System.out.println("Enqueued: 30");
        
        // Dequeue element
        int removed = queue.poll();
        System.out.println("Dequeued: " + removed);
        
        // Enqueue another element
        queue.offer(40);
        System.out.println("Enqueued: 40");
        
        // Peek front element
        System.out.println("Front: " + queue.peek());
    }
}`,
  },
  {
    id: 'java-bst',
    name: 'BST Insertion',
    category: 'Trees',
    language: 'java',
    dataStructure: 'bst',
    description: 'Insert nodes into a Binary Search Tree',
    code: `// Binary Search Tree in Java
class TreeNode {
    int value;
    TreeNode left, right;
    
    TreeNode(int value) {
        this.value = value;
        left = right = null;
    }
}

public class BST {
    TreeNode root;
    
    void insert(int value) {
        root = insertRec(root, value);
    }
    
    TreeNode insertRec(TreeNode root, int value) {
        if (root == null) {
            System.out.println("Inserted: " + value);
            return new TreeNode(value);
        }
        
        if (value < root.value) {
            System.out.println(value + " → left of " + root.value);
            root.left = insertRec(root.left, value);
        } else {
            System.out.println(value + " → right of " + root.value);
            root.right = insertRec(root.right, value);
        }
        return root;
    }
    
    public static void main(String[] args) {
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);
        bst.insert(20);
        bst.insert(40);
        bst.insert(60);
        bst.insert(80);
    }
}`,
  },
  {
    id: 'java-binary-search',
    name: 'Binary Search',
    category: 'Searching',
    language: 'java',
    dataStructure: 'array',
    description: 'Search for element using binary search',
    code: `// Binary Search Algorithm in Java
public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            int mid = (left + right) / 2;
            System.out.println("Checking index " + mid + ": " + arr[mid]);
            
            if (arr[mid] == target) {
                System.out.println("Found at index " + mid);
                return mid;
            }
            
            if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        System.out.println("Not found");
        return -1;
    }
    
    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        binarySearch(arr, 23);
    }
}`,
  },
  {
    id: 'java-linked-list',
    name: 'Reverse Linked List',
    category: 'Linked List',
    language: 'java',
    dataStructure: 'linkedList',
    description: 'Reverse a singly linked list',
    code: `// Reverse Linked List in Java
class ListNode {
    int value;
    ListNode next;
    
    ListNode(int value) {
        this.value = value;
        this.next = null;
    }
}

public class LinkedListReverse {
    public static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode current = head;
        
        while (current != null) {
            ListNode next = current.next;
            current.next = prev;
            System.out.println("Reversed: " + current.value);
            prev = current;
            current = next;
        }
        
        return prev;
    }
    
    public static void main(String[] args) {
        // Create: 1 → 2 → 3 → 4 → 5
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        head.next.next = new ListNode(3);
        head.next.next.next = new ListNode(4);
        head.next.next.next.next = new ListNode(5);
        
        reverse(head);
    }
}`,
  },
  
  // C++ Snippets
  {
    id: 'cpp-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    language: 'cpp',
    dataStructure: 'array',
    description: 'Sort array using bubble sort algorithm',
    code: `// Bubble Sort in C++
#include <iostream>
using namespace std;

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            // Compare adjacent elements
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    return 0;
}`,
  },
  {
    id: 'cpp-stack',
    name: 'Stack Operations',
    category: 'Stack',
    language: 'cpp',
    dataStructure: 'stack',
    description: 'Demonstrate stack push and pop operations',
    code: `// Stack Operations in C++
#include <iostream>
#include <stack>
using namespace std;

int main() {
    stack<int> st;
    
    // Push elements
    st.push(10);
    cout << "Pushed: 10" << endl;
    
    st.push(20);
    cout << "Pushed: 20" << endl;
    
    st.push(30);
    cout << "Pushed: 30" << endl;
    
    // Pop element
    cout << "Popped: " << st.top() << endl;
    st.pop();
    
    // Push another element
    st.push(40);
    cout << "Pushed: 40" << endl;
    
    cout << "Top: " << st.top() << endl;
    
    return 0;
}`,
  },
  
  // C Snippets
  {
    id: 'c-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    language: 'c',
    dataStructure: 'array',
    description: 'Sort array using bubble sort algorithm',
    code: `// Bubble Sort in C
#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            // Compare adjacent elements
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    return 0;
}`,
  },
  {
    id: 'c-stack',
    name: 'Stack (Array)',
    category: 'Stack',
    language: 'c',
    dataStructure: 'stack',
    description: 'Stack implementation using array',
    code: `// Stack Implementation in C
#include <stdio.h>
#define MAX 100

int stack[MAX];
int top = -1;

void push(int value) {
    if (top >= MAX - 1) {
        printf("Stack Overflow\\\\n");
        return;
    }
    stack[++top] = value;
    printf("Pushed: %d\\\\n", value);
}

int pop() {
    if (top < 0) {
        printf("Stack Underflow\\\\n");
        return -1;
    }
    int value = stack[top--];
    printf("Popped: %d\\\\n", value);
    return value;
}

int main() {
    push(10);
    push(20);
    push(30);
    pop();
    push(40);
    return 0;
}`,
  },
  
  // Python Snippets
  {
    id: 'python-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    language: 'python',
    dataStructure: 'array',
    description: 'Sort array using bubble sort algorithm',
    code: `# Bubble Sort in Python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            # Compare adjacent elements
            if arr[j] > arr[j + 1]:
                # Swap elements
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# Run with input
arr = [64, 34, 25, 12, 22, 11, 90]
bubble_sort(arr)`,
  },
  {
    id: 'python-stack',
    name: 'Stack Operations',
    category: 'Stack',
    language: 'python',
    dataStructure: 'stack',
    description: 'Demonstrate stack push and pop operations',
    code: `# Stack Operations in Python
class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, element):
        self.items.append(element)
        print(f"Pushed: {element}")
    
    def pop(self):
        if self.is_empty():
            return "Stack is empty"
        removed = self.items.pop()
        print(f"Popped: {removed}")
        return removed
    
    def is_empty(self):
        return len(self.items) == 0
    
    def peek(self):
        return self.items[-1] if self.items else None

# Run demonstration
stack = Stack()
stack.push(10)
stack.push(20)
stack.push(30)
stack.pop()
stack.push(40)`,
  },
  {
    id: 'python-bst',
    name: 'BST Insertion',
    category: 'Trees',
    language: 'python',
    dataStructure: 'bst',
    description: 'Insert nodes into a Binary Search Tree',
    code: `# Binary Search Tree in Python
class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        if not self.root:
            self.root = TreeNode(value)
            print(f"Root: {value}")
            return
        
        current = self.root
        while True:
            if value < current.value:
                if not current.left:
                    current.left = TreeNode(value)
                    print(f"{value} → left of {current.value}")
                    break
                current = current.left
            else:
                if not current.right:
                    current.right = TreeNode(value)
                    print(f"{value} → right of {current.value}")
                    break
                current = current.right

# Build BST
bst = BST()
bst.insert(50)
bst.insert(30)
bst.insert(70)
bst.insert(20)
bst.insert(40)
bst.insert(60)
bst.insert(80)`,
  },
  
  // JavaScript Snippets (keep existing)
  {
    id: 'js-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    language: 'javascript',
    dataStructure: 'array',
    description: 'Sort array using bubble sort algorithm',
    code: `// Bubble Sort Algorithm
function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

// Run with: [64, 34, 25, 12, 22, 11, 90]
bubbleSort(input);`,
  },
  {
    id: 'js-stack',
    name: 'Stack Push/Pop',
    category: 'Stack',
    language: 'javascript',
    dataStructure: 'stack',
    description: 'Demonstrate stack push and pop operations',
    code: `// Stack Operations
class Stack {
  constructor() {
    this.items = [];
  }
  
  push(element) {
    this.items.push(element);
    console.log("Pushed: " + element);
  }
  
  pop() {
    if (this.isEmpty()) {
      return "Stack is empty";
    }
    let removed = this.items.pop();
    console.log("Popped: " + removed);
    return removed;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  peek() {
    return this.items[this.items.length - 1];
  }
}

// Run demonstration
let stack = new Stack();
stack.push(10);
stack.push(20);
stack.push(30);
stack.pop();
stack.push(40);`,
  },
];

export const getSnippetsByLanguage = (language: ProgrammingLanguage): CodeSnippet[] => {
  return codeSnippets.filter(snippet => snippet.language === language);
};

export const getDefaultSnippet = (language: ProgrammingLanguage): CodeSnippet | undefined => {
  return codeSnippets.find(snippet => snippet.language === language);
};

export const languageConfig: Record<ProgrammingLanguage, { label: string; monacoId: string }> = {
  java: { label: 'Java', monacoId: 'java' },
  cpp: { label: 'C++', monacoId: 'cpp' },
  c: { label: 'C', monacoId: 'c' },
  python: { label: 'Python', monacoId: 'python' },
  javascript: { label: 'JavaScript', monacoId: 'javascript' },
};

