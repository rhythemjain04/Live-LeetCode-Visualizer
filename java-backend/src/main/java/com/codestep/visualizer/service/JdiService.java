package com.codestep.visualizer.service;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class JdiService {

    private static final long DEBUG_TIMEOUT_SECONDS = 30;
    private static final int MAX_STEPS = 5000;

    public List<Object> debug(Path classPath, String mainClass) {
        List<Object> events = new ArrayList<>();
        AtomicReference<VirtualMachine> vmRef = new AtomicReference<>(null);
        Process vmProcess = null;

        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            VirtualMachine vm = launch(classPath.toString(), mainClass);
            vmRef.set(vm);
            vmProcess = vm.process();
            enableClassPrepareRequest(vm, mainClass);

            final Process finalProcess = vmProcess;
            Future<List<Object>> future = executor.submit(() -> {
                List<Object> result = new ArrayList<>();
                EventQueue queue = vm.eventQueue();
                boolean connected = true;

                while (connected && result.size() < MAX_STEPS) {
                    EventSet eventSet = queue.remove(5000); // 5s timeout per event poll
                    if (eventSet == null) {
                        // No events for 5 seconds — likely done
                        break;
                    }
                    for (Event event : eventSet) {
                        if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                            connected = false;
                        } else if (event instanceof ClassPrepareEvent) {
                            createStepRequest(vm, (ClassPrepareEvent) event);
                        } else if (event instanceof StepEvent) {
                            Map<String, Object> eventData = handleStep((StepEvent) event, mainClass);
                            if (eventData != null) {
                                result.add(eventData);
                            }
                        }
                    }
                    eventSet.resume();
                }
                return result;
            });

            events = future.get(DEBUG_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            System.err.println("[JdiService] Debug session timed out after " + DEBUG_TIMEOUT_SECONDS + "s");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            executor.shutdownNow();
            VirtualMachine vm = vmRef.get();
            if (vm != null) {
                try { vm.dispose(); } catch (Exception ignored) {}
                try { vm.exit(0); } catch (Exception ignored) {}
            }
            if (vmProcess != null) {
                vmProcess.destroyForcibly();
                System.out.println("[JdiService] Debuggee process forcibly destroyed.");
            }
        }
        return events;
    }

    private VirtualMachine launch(String classPath, String mainClass) throws Exception {
        LaunchingConnector launchingConnector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = launchingConnector.defaultArguments();
        arguments.get("main").setValue(mainClass);
        arguments.get("options").setValue("-cp \"" + classPath + "\"");
        return launchingConnector.launch(arguments);
    }

    private void enableClassPrepareRequest(VirtualMachine vm, String mainClass) {
        EventRequestManager erm = vm.eventRequestManager();
        ClassPrepareRequest classPrepareRequest = erm.createClassPrepareRequest();
        classPrepareRequest.addClassFilter(mainClass);
        classPrepareRequest.enable();
    }

    private void createStepRequest(VirtualMachine vm, ClassPrepareEvent event) {
        EventRequestManager erm = vm.eventRequestManager();
        ThreadReference thread = event.thread();

        boolean exists = erm.stepRequests().stream()
                .anyMatch(r -> r.thread().equals(thread));
        if (exists)
            return;

        StepRequest stepRequest = erm.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
        stepRequest.addClassFilter(event.referenceType().name() + "*");
        stepRequest.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
        stepRequest.enable();
    }

    private Map<String, Object> handleStep(StepEvent event, String mainClass) {
        try {
            Location loc = event.location();
            if (!loc.declaringType().name().startsWith(mainClass))
                return null;

            Map<String, Object> eventData = new HashMap<>();
            eventData.put("line", loc.lineNumber());
            eventData.put("file", loc.sourceName());
            eventData.put("type", "step");

            Map<String, Object> vars = new HashMap<>();
            List<Object> structures = new ArrayList<>();
            StackFrame frame = event.thread().frame(0);

            try {
                for (LocalVariable v : frame.visibleVariables()) {
                    Value val = frame.getValue(v);
                    Object rendered = renderValue(event.thread(), val, 0);
                    vars.put(v.name(), rendered);

                    // Build structure snapshots for visualization
                    if (val instanceof ArrayReference) {
                        // Primitive/object array
                        Map<String, Object> s = new HashMap<>();
                        s.put("name", v.name());
                        s.put("kind", "array"); // TODO
                        s.put("values", rendered); // already a List from renderValue
                        structures.add(s);
                    } else if (val instanceof ObjectReference objRef) {
                        String typeName = objRef.referenceType().name();

                        // Java collection types → snapshotCollection
                        if (typeName.startsWith("java.util.")) {
                            Map<String, Object> s = snapshotCollection(event.thread(), v.name(), objRef, typeName);
                            if (s != null)
                                structures.add(s);
                        } else {
                            // User-defined class: detect tree nodes, linked list nodes, or graph nodes
                            ReferenceType objType = objRef.referenceType();
                            boolean hasLeft = objType.fieldByName("left") != null;
                            boolean hasRight = objType.fieldByName("right") != null;
                            boolean hasNext = objType.fieldByName("next") != null;

                            if (hasLeft && hasRight && !hasNext) {
                                // Tree/BST node
                                Map<String, Object> s = snapshotTree(event.thread(), v.name(), objRef);
                                if (s != null)
                                    structures.add(s);
                            } else if (hasNext) {
                                // Linked list node
                                Map<String, Object> s = snapshotLinkedList(event.thread(), v.name(), objRef);
                                if (s != null)
                                    structures.add(s);
                            }
                        }
                    }
                }
            } catch (AbsentInformationException e) {
                // debug info not available
            }

            eventData.put("vars", vars);
            eventData.put("structures", structures);

            // Call stack
            List<Map<String, Object>> callStack = new ArrayList<>();
            for (StackFrame f : event.thread().frames()) {
                Map<String, Object> frameData = new HashMap<>();
                frameData.put("functionName", f.location().method().name());
                frameData.put("line", f.location().lineNumber());
                callStack.add(frameData);
            }
            eventData.put("callStack", callStack);

            return eventData;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // ─── Value Rendering ────────────────────────────────────────────────────────

    private Object renderValue(ThreadReference thread, Value val, int depth) {
        if (val == null)
            return null;

        if (val instanceof PrimitiveValue pv) {
            if (pv instanceof IntegerValue iv)
                return iv.value();
            if (pv instanceof LongValue lv)
                return lv.value();
            if (pv instanceof ShortValue sv)
                return sv.value();
            if (pv instanceof ByteValue bv)
                return bv.value();
            if (pv instanceof FloatValue fv)
                return fv.value();
            if (pv instanceof DoubleValue dv)
                return dv.value();
            if (pv instanceof BooleanValue bv2)
                return bv2.value();
            if (pv instanceof CharValue cv)
                return String.valueOf(cv.value());
            return pv.toString();
        }

        if (depth > 5)
            return "...";

        if (val instanceof ArrayReference arr) {
            int len = Math.min(arr.length(), 50);
            List<Object> out = new ArrayList<>();
            for (int i = 0; i < len; i++) {
                out.add(renderValue(thread, arr.getValue(i), depth + 1));
            }
            return out;
        }

        if (val instanceof ObjectReference ref) {
            ReferenceType type = ref.referenceType();
            String typeName = type.name();

            if (val instanceof StringReference sr)
                return sr.value();

            // Unbox wrapper types
            if (typeName.equals("java.lang.Integer") || typeName.equals("java.lang.Boolean") ||
                    typeName.equals("java.lang.Double") || typeName.equals("java.lang.Float") ||
                    typeName.equals("java.lang.Long") || typeName.equals("java.lang.Short") ||
                    typeName.equals("java.lang.Byte") || typeName.equals("java.lang.Character")) {
                Field f = type.fieldByName("value");
                if (f != null)
                    return renderValue(thread, ref.getValue(f), depth + 1);
            }

            // java.util.* collections — use direct field access (avoids method invocation
            // issues)
            if (typeName.startsWith("java.util.")) {
                List<Object> extracted = extractCollectionAsList(thread, ref, typeName, depth + 1);
                if (extracted != null)
                    return extracted;
                // Return empty list for empty collections instead of "<Type>" string
                // This gives proper typing downstream (Array instead of String)
                String lower = typeName.toLowerCase();
                if (lower.contains("map") || lower.contains("set") || lower.contains("list")
                        || lower.contains("queue") || lower.contains("stack")
                        || lower.contains("deque") || lower.contains("vector")) {
                    return new ArrayList<>();
                }
                return "<" + simpleCollectionName(typeName) + ">";
            }

            // User-defined classes — render fields
            if (!typeName.startsWith("java.") && !typeName.startsWith("jdk.") &&
                    !typeName.startsWith("sun.") && !typeName.startsWith("com.sun.")) {
                Map<String, Object> fields = new HashMap<>();
                fields.put("@id", ref.uniqueID());
                try {
                    for (Field f : type.visibleFields()) {
                        fields.put(f.name(), renderValue(thread, ref.getValue(f), depth + 1));
                    }
                    return fields;
                } catch (Exception e) {
                    /* fall through */ }
            }

            return "Object(" + typeName + ")";
        }

        return val.toString();
    }

    // ─── Collection Snapshot for Structures ─────────────────────────────────────

    /**
     * Build a structure snapshot map for java.util collections, used for the
     * visualization panel. Returns null if this type is not a visualisable
     * collection.
     */
    private Map<String, Object> snapshotCollection(ThreadReference thread, String name,
            ObjectReference ref, String typeName) {
        String lower = typeName.toLowerCase();

        // Skip non-collection util types
        if (lower.contains("scanner") || lower.contains("random") || lower.contains("optional") ||
                lower.contains("iterator") || lower.contains("spliterator") ||
                lower.contains("comparator") || lower.contains("entry")) {
            return null;
        }

        List<Object> values = extractCollectionAsList(thread, ref, typeName, 1);
        if (values == null || values.isEmpty())
            return null;

        // Determine kind from type name
        String kind = classifyKind(lower);

        // Heuristic: override kind to "graph" if variable name suggests a graph
        String lowerName = name.toLowerCase();
        if (lowerName.contains("graph") || lowerName.contains("adj") || lowerName.contains("edge")
                || lowerName.contains("neighbor") || lowerName.equals("g")) {
            kind = "graph";
        }

        Map<String, Object> out = new HashMap<>();
        out.put("name", name);
        out.put("kind", kind);
        out.put("values", values);
        return out;
    }

    /**
     * Extract elements from common java.util collections using direct JDI field
     * access.
     * No method invocation — works reliably in any suspension context.
     */
    private List<Object> extractCollectionAsList(ThreadReference thread, ObjectReference ref,
            String typeName, int depth) {
        try {
            String lower = typeName.toLowerCase();
            ReferenceType type = ref.referenceType();

            // ── ArrayList / Vector / Stack ──
            if (lower.contains("arraylist") || lower.contains("vector") || lower.contains("stack")) {
                Field sizeField = findField(type, "elementCount"); // Vector/Stack
                if (sizeField == null)
                    sizeField = findField(type, "size"); // ArrayList
                Field dataField = findField(type, "elementData");
                if (dataField != null && sizeField != null) {
                    Value dataVal = ref.getValue(dataField);
                    Value sizeVal = ref.getValue(sizeField);
                    int sz = sizeVal instanceof IntegerValue iv ? iv.value() : 0;
                    if (dataVal instanceof ArrayReference arr) {
                        int len = Math.min(sz, Math.min(arr.length(), 50));
                        List<Object> result = new ArrayList<>();
                        for (int i = 0; i < len; i++)
                            result.add(renderValue(thread, arr.getValue(i), depth));
                        return result;
                    }
                }
            }

            // ── ArrayDeque ──
            if (lower.contains("arraydeque")) {
                Field elemField = findField(type, "elements");
                Field headField = findField(type, "head");
                Field tailField = findField(type, "tail");
                if (elemField != null && headField != null && tailField != null) {
                    Value elemsVal = ref.getValue(elemField);
                    int head = ((IntegerValue) ref.getValue(headField)).value();
                    int tail = ((IntegerValue) ref.getValue(tailField)).value();
                    if (elemsVal instanceof ArrayReference arr) {
                        int capacity = arr.length();
                        int size = (tail - head) & (capacity - 1);
                        if (size > 0) {
                            int len = Math.min(size, 50);
                            List<Object> result = new ArrayList<>();
                            for (int i = 0; i < len; i++) {
                                int idx = (head + i) & (capacity - 1);
                                result.add(renderValue(thread, arr.getValue(idx), depth));
                            }
                            return result;
                        }
                        // Fallback for empty or Java 17+ with different head/tail semantics
                        List<Object> result = new ArrayList<>();
                        for (int i = 0; i < Math.min(capacity, 50); i++) {
                            Value v = arr.getValue(i);
                            if (v != null && !v.toString().equals("null")) {
                                result.add(renderValue(thread, v, depth));
                            }
                        }
                        return result;
                    }
                }
            }

            // ── LinkedList (java.util.LinkedList) ──
            if (lower.contains("linkedlist")) {
                Field sizeField = findField(type, "size");
                Field firstField = findField(type, "first");
                if (firstField != null) {
                    int sz = 0;
                    if (sizeField != null) {
                        Value sv = ref.getValue(sizeField);
                        if (sv instanceof IntegerValue iv)
                            sz = iv.value();
                    }
                    Value firstVal = ref.getValue(firstField);
                    if (firstVal instanceof ObjectReference node) {
                        List<Object> elems = new ArrayList<>();
                        int limit = Math.min(sz > 0 ? sz : 50, 50);
                        for (int i = 0; i < limit && node != null; i++) {
                            ReferenceType nodeType = node.referenceType();
                            Field itemField = findField(nodeType, "item");
                            Field nextNodeField = findField(nodeType, "next");
                            if (itemField != null)
                                elems.add(renderValue(thread, node.getValue(itemField), depth));
                            node = nextNodeField != null && node.getValue(nextNodeField) instanceof ObjectReference nr
                                    ? nr
                                    : null;
                        }
                        return elems;
                    }
                }
            }

            // ── PriorityQueue ──
            if (lower.contains("priorityqueue")) {
                Field queueField = findField(type, "queue");
                Field sizeField = findField(type, "size");
                if (queueField != null && sizeField != null) {
                    Value sv = ref.getValue(sizeField);
                    int sz = sv instanceof IntegerValue iv ? iv.value() : 0;
                    Value qv = ref.getValue(queueField);
                    if (qv instanceof ArrayReference arr) {
                        int len = Math.min(sz, Math.min(arr.length(), 50));
                        List<Object> result = new ArrayList<>();
                        for (int i = 0; i < len; i++)
                            result.add(renderValue(thread, arr.getValue(i), depth));
                        return result;
                    }
                }
            }

            // ── HashMap / LinkedHashMap ──
            if (lower.contains("hashmap") || lower.contains("linkedhashmap")) {
                Field tableField = findField(type, "table");
                if (tableField != null) {
                    Value tv = ref.getValue(tableField);
                    if (tv instanceof ArrayReference arr) {
                        List<Object> entries = new ArrayList<>();
                        for (int i = 0; i < arr.length() && entries.size() < 50; i++) {
                            Value bucket = arr.getValue(i);
                            if (bucket instanceof ObjectReference node) {
                                while (node != null && entries.size() < 50) {
                                    ReferenceType nodeType = node.referenceType();
                                    Field keyField = findField(nodeType, "key");
                                    Field valField2 = findField(nodeType, "value");
                                    Field nextField = findField(nodeType, "next");
                                    if (keyField != null && valField2 != null) {
                                        Object k = renderValue(thread, node.getValue(keyField), depth);
                                        Object v = renderValue(thread, node.getValue(valField2), depth);
                                        entries.add(k + "=" + v);
                                    }
                                    node = nextField != null && node.getValue(nextField) instanceof ObjectReference nr
                                            ? nr
                                            : null;
                                }
                            }
                        }
                        if (!entries.isEmpty())
                            return entries;
                    }
                }
            }

            // ── HashSet / LinkedHashSet / TreeSet (wraps a backing map) ──
            if (lower.contains("hashset") || lower.contains("treeset")) {
                Field mapField = findField(type, "map");
                if (mapField == null)
                    mapField = findField(type, "m"); // TreeSet
                if (mapField != null) {
                    Value mv = ref.getValue(mapField);
                    if (mv instanceof ObjectReference mapRef) {
                        return extractCollectionAsList(thread, mapRef, mapRef.referenceType().name(), depth);
                    }
                }
            }

            // ── TreeMap ──
            if (lower.contains("treemap")) {
                Field sizeField = findField(type, "size");
                Field rootField = findField(type, "root");
                if (rootField != null) {
                    Value rootVal = ref.getValue(rootField);
                    if (rootVal instanceof ObjectReference root) {
                        List<Object> entries = new ArrayList<>();
                        collectTreeMapEntries(thread, root, entries, depth, 50);
                        return entries;
                    }
                }
            }

        } catch (Exception ignored) {
        }
        return null;
    }

    private void collectTreeMapEntries(ThreadReference thread, ObjectReference node,
            List<Object> entries, int depth, int limit) {
        if (node == null || entries.size() >= limit)
            return;
        try {
            ReferenceType nodeType = node.referenceType();
            Field leftField = findField(nodeType, "left");
            Field rightField = findField(nodeType, "right");
            Field keyField = findField(nodeType, "key");
            Field valField = findField(nodeType, "value");

            if (leftField != null) {
                Value lv = node.getValue(leftField);
                if (lv instanceof ObjectReference lr)
                    collectTreeMapEntries(thread, lr, entries, depth, limit);
            }
            if (keyField != null && valField != null) {
                Object k = renderValue(thread, node.getValue(keyField), depth);
                Object v = renderValue(thread, node.getValue(valField), depth);
                entries.add(k + "=" + v);
            }
            if (rightField != null) {
                Value rv = node.getValue(rightField);
                if (rv instanceof ObjectReference rr)
                    collectTreeMapEntries(thread, rr, entries, depth, limit);
            }
        } catch (Exception ignored) {
        }
    }

    // ─── Linked List (user-defined node class) ───────────────────────────────────

    private Map<String, Object> snapshotLinkedList(ThreadReference thread, String name, ObjectReference ref) {
        try {
            ReferenceType type = ref.referenceType();
            Field nextField = type.fieldByName("next");
            if (nextField == null)
                return null;

            Field valField = type.fieldByName("val");
            if (valField == null)
                valField = type.fieldByName("value");
            if (valField == null)
                valField = type.fieldByName("data");

            Field prevField = type.fieldByName("prev");
            if (prevField == null)
                prevField = type.fieldByName("previous");

            Map<String, Map<String, Object>> nodes = new LinkedHashMap<>();
            ObjectReference current = ref;
            String headId = String.valueOf(current.uniqueID());

            int limit = 100;
            int count = 0;

            while (current != null && count < limit) {
                String id = String.valueOf(current.uniqueID());
                if (nodes.containsKey(id))
                    break;

                Object val = "?";
                if (valField != null)
                    val = renderValue(thread, current.getValue(valField), 0);

                String nextId = null;
                Value nextVal = current.getValue(nextField);
                ObjectReference nextRef = null;
                if (nextVal instanceof ObjectReference) {
                    nextRef = (ObjectReference) nextVal;
                    nextId = String.valueOf(nextRef.uniqueID());
                }

                String prevId = null;
                if (prevField != null) {
                    Value prevVal = current.getValue(prevField);
                    if (prevVal instanceof ObjectReference pvr) {
                        prevId = String.valueOf(pvr.uniqueID());
                    }
                }

                Map<String, Object> nodeData = new HashMap<>();
                nodeData.put("id", id);
                nodeData.put("val", val);
                nodeData.put("next", nextId);
                nodeData.put("prev", prevId);
                nodes.put(id, nodeData);

                current = nextRef;
                count++;
            }

            Map<String, Object> out = new HashMap<>();
            out.put("name", name);
            out.put("kind", "linkedlist");
            out.put("nodes", nodes);
            out.put("head", headId);
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    // ─── Tree / BST (user-defined node class with left/right) ────────────────────

    private Map<String, Object> snapshotTree(ThreadReference thread, String name, ObjectReference ref) {
        try {
            ReferenceType type = ref.referenceType();
            Field leftField = type.fieldByName("left");
            Field rightField = type.fieldByName("right");
            if (leftField == null || rightField == null)
                return null;

            // Find value field
            Field valField = type.fieldByName("val");
            if (valField == null) valField = type.fieldByName("value");
            if (valField == null) valField = type.fieldByName("data");
            if (valField == null) valField = type.fieldByName("key");

            Map<String, Map<String, Object>> nodes = new LinkedHashMap<>();
            String rootId = String.valueOf(ref.uniqueID());

            // BFS traversal
            Queue<ObjectReference> queue = new LinkedList<>();
            queue.add(ref);
            int limit = 200;

            while (!queue.isEmpty() && nodes.size() < limit) {
                ObjectReference current = queue.poll();
                String id = String.valueOf(current.uniqueID());
                if (nodes.containsKey(id))
                    continue;

                Object val = "?";
                if (valField != null)
                    val = renderValue(thread, current.getValue(valField), 0);

                String leftId = null;
                Value leftVal = current.getValue(leftField);
                if (leftVal instanceof ObjectReference lr) {
                    leftId = String.valueOf(lr.uniqueID());
                    queue.add(lr);
                }

                String rightId = null;
                Value rightVal = current.getValue(rightField);
                if (rightVal instanceof ObjectReference rr) {
                    rightId = String.valueOf(rr.uniqueID());
                    queue.add(rr);
                }

                Map<String, Object> nodeData = new HashMap<>();
                nodeData.put("id", id);
                nodeData.put("val", val);
                nodeData.put("left", leftId);
                nodeData.put("right", rightId);
                nodes.put(id, nodeData);
            }

            Map<String, Object> out = new HashMap<>();
            out.put("name", name);
            out.put("kind", "bst");
            out.put("nodes", nodes);
            out.put("root", rootId);
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    /** Walk up the type hierarchy to find a field by name. */
    private Field findField(ReferenceType type, String name) {
        try {
            for (Field f : type.allFields()) {
                if (f.name().equals(name))
                    return f;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String classifyKind(String lowerTypeName) {
        if (lowerTypeName.contains("stack"))
            return "stack";
        if (lowerTypeName.contains("priorityqueue"))
            return "heap";
        if (lowerTypeName.contains("deque") || lowerTypeName.contains("queue"))
            return "queue";
        if (lowerTypeName.contains("linkedlist"))
            return "linkedlist";
        if (lowerTypeName.contains("hashmap") || lowerTypeName.contains("treemap") ||
                lowerTypeName.contains("linkedhashmap"))
            return "hashmap";
        if (lowerTypeName.contains("hashset") || lowerTypeName.contains("treeset") ||
                lowerTypeName.contains("linkedhashset"))
            return "hashset";
        return "array"; // ArrayList, Vector, etc.
    }

    private String simpleCollectionName(String typeName) {
        int dot = typeName.lastIndexOf('.');
        return dot >= 0 ? typeName.substring(dot + 1) : typeName;
    }
}
