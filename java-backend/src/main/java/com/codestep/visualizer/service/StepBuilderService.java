package com.codestep.visualizer.service;

import com.codestep.visualizer.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StepBuilderService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<ExecutionStep> buildSteps(List<Object> events) {
        List<ExecutionStep> steps = new ArrayList<>();
        Map<String, Object> prevVars = new HashMap<>();

        for (Object eventObj : events) {
            Map<String, Object> ev = (Map<String, Object>) eventObj;

            // Extract structures first so we can use kind info for variable typing
            List<Map<String, Object>> structures = (List<Map<String, Object>>) ev.getOrDefault("structures",
                    new ArrayList<>());

            // Build a map of variable-name → structure-kind for proper type display
            Map<String, String> varKindMap = new HashMap<>();
            for (Map<String, Object> s : structures) {
                String structName = (String) s.get("name");
                String kind = String.valueOf(s.get("kind"));
                if (structName != null && kind != null) {
                    varKindMap.put(structName, kind);
                }
            }

            // Extract variables
            Map<String, Object> vars = (Map<String, Object>) ev.getOrDefault("vars", new HashMap<>());
            List<Variable> variables = new ArrayList<>();
            for (Map.Entry<String, Object> entry : vars.entrySet()) {
                String name = entry.getKey();
                Object value = entry.getValue();
                Object prev = prevVars.get(name);

                boolean changed = !Objects.equals(stringify(prev), stringify(value));
                String structKind = varKindMap.get(name);
                String displayValue = formatDisplayValue(value, structKind);
                String type = valueType(value, structKind);

                variables.add(new Variable(name, displayValue, type, changed));
            }

            // Build visualizations from structures
            List<Visualization> visualizations = new ArrayList<>();

            for (Map<String, Object> s : structures) {
                String kind = String.valueOf(s.get("kind"));
                String name = (String) s.get("name");
                String ds = mapKindToDs(kind);

                List<VisualizationNode> nodes = new ArrayList<>();
                List<Edge> edges = new ArrayList<>();

                if (ds.equals("linkedList") && s.containsKey("nodes") && s.get("nodes") instanceof Map) {
                    // Linked list with node map and head pointer
                    nodes = buildLinkedListNodesFromMap((Map<String, Map<String, Object>>) s.get("nodes"),
                            (String) s.get("head"), vars);
                    edges = buildLinkedListEdges(nodes);
                } else if (ds.equals("bst") && s.containsKey("nodes") && s.get("nodes") instanceof Map) {
                    // BST/tree with node map and root pointer
                    nodes = buildTreeNodesFromMap((Map<String, Map<String, Object>>) s.get("nodes"),
                            (String) s.get("root"), vars);
                } else {
                    // All other DS types: array, stack, queue, hashTable, heap, graph
                    Object valuesObj = s.get("values");
                    List<Object> values = new ArrayList<>();
                    if (valuesObj instanceof List) {
                        values = (List<Object>) valuesObj;
                    } else if (valuesObj != null) {
                        values.add(valuesObj);
                    }
                    nodes = buildNodes(ds, values, vars);

                    // Build edges for graph data structures
                    if ("graph".equals(ds) && !values.isEmpty()) {
                        edges = buildGraphEdges(values, nodes);
                    }
                }

                visualizations.add(Visualization.builder()
                        .title(name)
                        .dataStructure(ds)
                        .nodes(nodes)
                        .edges(edges)
                        .build());
            }

            Visualization primaryViz = visualizations.isEmpty() ? null : visualizations.get(0);

            // Call stack
            List<Map<String, Object>> callStackRaw = (List<Map<String, Object>>) ev.getOrDefault("callStack",
                    new ArrayList<>());
            List<StackFrame> callStack = callStackRaw.stream()
                    .map(f -> new StackFrame((String) f.get("functionName"), (Integer) f.get("line"),
                            new ArrayList<>()))
                    .collect(Collectors.toList());

            // Console
            List<String> console = new ArrayList<>();
            String file = (String) ev.get("file");
            Integer line = (Integer) ev.get("line");
            if (file != null && line != null)
                console.add("Executing " + file + ":" + line);

            ExecutionStep step = new ExecutionStep();
            step.setLine(line != null ? line : 0);
            step.setCode("");
            step.setDescription(file + ":" + line);
            step.setNodes(primaryViz != null ? primaryViz.getNodes() : new ArrayList<>());
            step.setEdges(primaryViz != null ? primaryViz.getEdges() : new ArrayList<>());
            step.setVisualizations(visualizations);
            step.setVariables(variables);
            step.setCallStack(callStack);
            step.setConsole(console);

            steps.add(step);
            prevVars = new HashMap<>(vars);
        }

        if (steps.isEmpty()) {
            ExecutionStep step = new ExecutionStep();
            step.setDescription("No steps captured");
            step.setConsole(Collections.singletonList("No trace events from Java"));
            steps.add(step);
        }

        return steps;
    }

    /**
     * Determine the display type for a variable.
     * Uses the structure kind from JDI to show proper collection type names.
     */
    private String valueType(Object v, String structKind) {
        // If we know the structure kind from JDI, use a friendly type name
        if (structKind != null) {
            switch (structKind.toLowerCase()) {
                case "hashmap": return "HashMap";
                case "hashset": return "HashSet";
                case "stack": return "Stack";
                case "queue": return "Queue";
                case "linkedlist": return "LinkedList";
                case "heap": return "PriorityQueue";
                case "bst":
                case "tree": return "TreeNode";
                case "array": return "Array";
            }
        }
        if (v instanceof List)
            return "Array";
        if (v instanceof Map)
            return "Object";
        if (v == null)
            return "null";
        return v.getClass().getSimpleName();
    }

    /**
     * Format a value for the Variables panel display.
     * Uses structure kind to choose between array [1,2,3] and map {k=v} formatting.
     */
    private String formatDisplayValue(Object value, String structKind) {
        if (value == null)
            return "null";
        if (value instanceof List<?> list) {
            // If this is a map-like collection (entries are "key=value" strings), use {k=v} format
            boolean isMapLike = structKind != null &&
                    (structKind.equalsIgnoreCase("hashmap") || structKind.equalsIgnoreCase("hashset"));
            if (isMapLike) {
                StringBuilder sb = new StringBuilder("{");
                for (int i = 0; i < list.size(); i++) {
                    if (i > 0)
                        sb.append(", ");
                    sb.append(String.valueOf(list.get(i)));
                }
                sb.append("}");
                return sb.toString();
            }
            // Regular list/array format
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0)
                    sb.append(", ");
                Object item = list.get(i);
                sb.append(item instanceof String s ? s : String.valueOf(item));
            }
            sb.append("]");
            return sb.toString();
        }
        if (value instanceof Map)
            return stringify(value);
        return String.valueOf(value);
    }

    private String stringify(Object v) {
        try {
            return objectMapper.writeValueAsString(v);
        } catch (Exception e) {
            return String.valueOf(v);
        }
    }

    private String mapKindToDs(String kind) {
        if (kind == null)
            return "array";
        switch (kind.toLowerCase()) {
            case "stack":
                return "stack";
            case "queue":
                return "queue";
            case "bst":
            case "tree":
                return "bst";
            case "linkedlist":
                return "linkedList";
            case "graph":
                return "graph";
            case "hashmap":
            case "hashset":
            case "hashtable":
                return "hashTable";
            case "heap":
                return "heap";
            case "2darray":
                return "array";
            default:
                return "array";
        }
    }

    private List<VisualizationNode> buildNodes(String ds, List<Object> values, Map<String, Object> vars) {
        if ("heap".equals(ds)) {
            return buildHeapNodes(values, vars);
        }
        if ("graph".equals(ds)) {
            return buildGraphNodes(values, vars);
        }
        // Check for 2D array
        if ("array".equals(ds) && !values.isEmpty() && values.get(0) instanceof List) {
            return build2DArrayNodes(values, vars);
        }
        if ("hashTable".equals(ds)) {
            return buildHashTableNodes(values, vars);
        }

        // Generic node builder for array, stack, queue, linkedList (flat values)
        List<VisualizationNode> nodes = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) {
            Object val = values.get(i);
            // Extract meaningful value from complex objects (e.g. TreeNode in a Queue)
            String displayVal = extractDisplayValue(val);
            nodes.add(VisualizationNode.builder()
                    .id(ds + "-node-" + i)
                    .value(displayVal)
                    .state("default")
                    .x(ds.equals("stack") ? 200 : 80 + i * 70)
                    .y(ds.equals("stack") ? 280 - i * 50 : 150)
                    .build());
        }

        // Highlight pointer-like indices for arrays/queues
        if (("array".equals(ds) || "queue".equals(ds)) && vars != null) {
            String[] maybeIdx = { "a", "b", "i", "j", "k", "left", "right", "mid", "low", "high",
                    "front", "back", "start", "end", "slow", "fast", "top", "bottom" };
            for (String key : maybeIdx) {
                Object idxObj = vars.get(key);
                if (idxObj instanceof Number) {
                    int idx = ((Number) idxObj).intValue();
                    if (idx >= 0 && idx < nodes.size()) {
                        nodes.get(idx).setState("active");
                    }
                }
            }
        }

        // Highlight top of stack
        if ("stack".equals(ds) && !nodes.isEmpty()) {
            nodes.get(nodes.size() - 1).setState("active");
        }

        return nodes;
    }

    /**
     * Extract a meaningful display value from a complex object.
     * If the value is a Map (representing a user-defined object like TreeNode),
     * try to extract the 'val', 'value', or 'data' field for display.
     * Otherwise, just stringify it.
     */
    private String extractDisplayValue(Object val) {
        if (val instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) val;
            // Try common value field names
            for (String fieldName : new String[]{"val", "value", "data", "key"}) {
                Object fieldVal = map.get(fieldName);
                if (fieldVal != null && !(fieldVal instanceof Map)) {
                    return String.valueOf(fieldVal);
                }
            }
            // If no simple value field, try to build a compact representation
            // excluding internal fields like @id, left, right, next, prev
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                String k = entry.getKey();
                if (k.equals("@id") || k.equals("left") || k.equals("right") 
                        || k.equals("next") || k.equals("prev")) continue;
                if (sb.length() > 0) sb.append(",");
                Object v = entry.getValue();
                if (v instanceof Map) {
                    sb.append(k).append(":...");
                } else {
                    sb.append(k).append(":").append(v);
                }
            }
            return sb.length() > 0 ? sb.toString() : stringify(val);
        }
        String displayVal = stringify(val);
        if (displayVal.startsWith("\"") && displayVal.endsWith("\"")) {
            displayVal = displayVal.substring(1, displayVal.length() - 1);
        }
        return displayVal;
    }

    /**
     * Build nodes for HashTable/HashMap/HashSet visualization.
     * Entries like "key=value" are displayed as-is in the hash table grid.
     */
    private List<VisualizationNode> buildHashTableNodes(List<Object> values, Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) {
            Object val = values.get(i);
            String displayVal = String.valueOf(val);
            nodes.add(VisualizationNode.builder()
                    .id("hashTable-node-" + i)
                    .value(displayVal)
                    .state("default")
                    .x(80 + (i % 6) * 100)
                    .y(100 + (i / 6) * 80)
                    .build());
        }
        return nodes;
    }

    private List<VisualizationNode> buildHeapNodes(List<Object> values, Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) {
            Object val = values.get(i);
            String id = "heap-node-" + i;
            String left = (i * 2 + 1 < values.size()) ? "heap-node-" + (i * 2 + 1) : null;
            String right = (i * 2 + 2 < values.size()) ? "heap-node-" + (i * 2 + 2) : null;

            nodes.add(VisualizationNode.builder()
                    .id(id)
                    .value(stringify(val))
                    .state("default")
                    .x(300 + (i % 2 == 0 ? -1 : 1) * (100 - (int) (Math.floor(Math.log(i + 1) / Math.log(2)) * 20)))
                    .y(50 + (int) (Math.floor(Math.log(i + 1) / Math.log(2)) * 80))
                    .left(left)
                    .right(right)
                    .build());
        }

        if (vars != null) {
            String[] heapVars = { "parent", "child", "current", "root" };
            for (String key : heapVars) {
                Object idxObj = vars.get(key);
                if (idxObj instanceof Number) {
                    int idx = ((Number) idxObj).intValue();
                    if (idx >= 0 && idx < nodes.size()) {
                        nodes.get(idx).setState("active");
                    }
                }
            }
        }
        return nodes;
    }

    private List<VisualizationNode> build2DArrayNodes(List<Object> values, Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        int rowCount = values.size();

        for (int r = 0; r < rowCount; r++) {
            List<?> row = (List<?>) values.get(r);
            for (int c = 0; c < row.size(); c++) {
                nodes.add(VisualizationNode.builder()
                        .id("array-node-" + r + "-" + c)
                        .value(stringify(row.get(c)))
                        .state("default")
                        .x(80 + c * 70)
                        .y(100 + r * 80)
                        .build());
            }
        }

        // Highlight logic for 2D array (e.g. i, j pointers highlighting rows/cols)
        if (vars != null) {
            Object rowObj = vars.get("i"); // commonly row index
            if (rowObj == null)
                rowObj = vars.get("row");

            if (rowObj instanceof Number) {
                int r = ((Number) rowObj).intValue();
                if (r >= 0 && r < values.size()) {
                    List<?> row = (List<?>) values.get(r);
                    for (int c = 0; c < row.size(); c++) {
                        // Find node and highlight
                        String targetId = "array-node-" + r + "-" + c;
                        nodes.stream().filter(n -> n.getId().equals(targetId)).findFirst()
                                .ifPresent(n -> n.setState("active"));
                    }
                }
            }
        }

        return nodes;
    }

    private List<VisualizationNode> buildGraphNodes(List<Object> values, Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        int cx = 300, cy = 175, r = 140;

        // Check if adjacency list/matrix (List of Lists)
        if (!values.isEmpty() && values.get(0) instanceof List) {
            int n = values.size();
            for (int i = 0; i < n; i++) {
                double angle = (2 * Math.PI * i) / n - Math.PI / 2;
                nodes.add(VisualizationNode.builder()
                        .id("graph-node-" + i)
                        .value(String.valueOf(i))
                        .state("default")
                        .x((int) (cx + r * Math.cos(angle)))
                        .y((int) (cy + r * Math.sin(angle)))
                        .build());
            }
        } else {
            // Flat list of values — create nodes in circular layout
            int n = values.size();
            for (int i = 0; i < n; i++) {
                Object val = values.get(i);
                double angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
                nodes.add(VisualizationNode.builder()
                        .id("graph-node-" + i)
                        .value(extractDisplayValue(val))
                        .state("default")
                        .x((int) (cx + r * Math.cos(angle)))
                        .y((int) (cy + r * Math.sin(angle)))
                        .build());
            }
        }
        return nodes;
    }

    /**
     * Build edges for graph data structure from adjacency list/matrix values.
     * Handles two formats:
     * 1. Adjacency list: [[1,2],[0,3],[0],[1]] — each sub-list contains neighbor indices
     * 2. Adjacency matrix: [[0,1,1],[1,0,0],[1,0,0]] — non-zero = edge exists
     */
    private List<Edge> buildGraphEdges(List<Object> values, List<VisualizationNode> nodes) {
        List<Edge> edges = new ArrayList<>();
        if (values.isEmpty() || !(values.get(0) instanceof List)) {
            return edges;
        }

        int n = values.size();
        boolean isMatrix = false;

        // Detect if this is an adjacency matrix (all sub-lists same length == n)
        List<?> firstRow = (List<?>) values.get(0);
        if (firstRow.size() == n) {
            // Check if values are 0/1 or small integers — likely a matrix
            boolean allNumeric = firstRow.stream().allMatch(v -> v instanceof Number);
            if (allNumeric) isMatrix = true;
        }

        if (isMatrix) {
            // Adjacency matrix: value[i][j] != 0 means edge from i to j
            for (int i = 0; i < n; i++) {
                List<?> row = (List<?>) values.get(i);
                for (int j = 0; j < row.size(); j++) {
                    Object val = row.get(j);
                    if (val instanceof Number && ((Number) val).intValue() != 0) {
                        if (i < nodes.size() && j < nodes.size()) {
                            edges.add(new Edge(nodes.get(i), nodes.get(j)));
                        }
                    }
                }
            }
        } else {
            // Adjacency list: values[i] = list of neighbor indices
            for (int i = 0; i < n; i++) {
                List<?> neighbors = (List<?>) values.get(i);
                for (Object neighbor : neighbors) {
                    int j = -1;
                    if (neighbor instanceof Number) {
                        j = ((Number) neighbor).intValue();
                    }
                    if (j >= 0 && j < nodes.size() && i < nodes.size()) {
                        edges.add(new Edge(nodes.get(i), nodes.get(j)));
                    }
                }
            }
        }
        return edges;
    }

    private List<VisualizationNode> buildLinkedListNodesFromMap(Map<String, Map<String, Object>> nodeMap, String headId,
            Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        Set<String> processedIds = new HashSet<>();

        String currentId = headId;
        int index = 0;

        // First pass: chain from head
        while (currentId != null && nodeMap.containsKey(currentId) && !processedIds.contains(currentId)) {
            processedIds.add(currentId);
            Map<String, Object> data = nodeMap.get(currentId);

            nodes.add(createLinkedListNode(data, index, 0));

            currentId = (String) data.get("next");
            index++;
        }

        // Second pass: disjoint nodes
        for (Map.Entry<String, Map<String, Object>> entry : nodeMap.entrySet()) {
            if (!processedIds.contains(entry.getKey())) {
                processedIds.add(entry.getKey());
                nodes.add(createLinkedListNode(entry.getValue(), index, 1));
                index++;
            }
        }

        // Highlight pointers
        highlightPointers(nodes, vars);

        return nodes;
    }

    private VisualizationNode createLinkedListNode(Map<String, Object> data, int index, int rowOffset) {
        Object val = data.get("val");
        // stringify val if object
        if (val instanceof Map)
            val = stringify(val);

        return VisualizationNode.builder()
                .id((String) data.get("id"))
                .value(val)
                .next((String) data.get("next"))
                .prev((String) data.get("prev"))
                .state("default")
                .x(100 + index * 150)
                .y(150 + rowOffset * 20)
                .pointers(new ArrayList<>())
                .build();
    }

    private void highlightPointers(List<VisualizationNode> nodes, Map<String, Object> vars) {
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            String name = entry.getKey();
            Object val = entry.getValue();

            if (val instanceof Map) {
                Map<String, Object> varMap = (Map<String, Object>) val;
                Object id = varMap.get("@id");
                if (id != null) {
                    String targetId = String.valueOf(id);
                    nodes.stream()
                            .filter(n -> n.getId().equals(targetId))
                            .findFirst()
                            .ifPresent(n -> {
                                if (!n.getPointers().contains(name)) {
                                    n.getPointers().add(name);
                                    // Optional: Set state to active to highlight the node color too
                                    if ("default".equals(n.getState())) {
                                        n.setState("active");
                                    }
                                }
                            });
                }
            }
        }
    }

    private List<Edge> buildLinkedListEdges(List<VisualizationNode> nodes) {
        List<Edge> edges = new ArrayList<>();
        for (VisualizationNode node : nodes) {
            if (node.getNext() != null) {
                nodes.stream()
                        .filter(n -> n.getId().equals(node.getNext()))
                        .findFirst()
                        .ifPresent(target -> edges.add(new Edge(node, target)));
            }
        }
        return edges;
    }

    // ─── BST / Tree Node Building ────────────────────────────────────────────────

    /**
     * Build VisualizationNodes for a BST/tree from the JDI snapshot map.
     * Each node in the map has: id, val, left (child id), right (child id).
     */
    private List<VisualizationNode> buildTreeNodesFromMap(Map<String, Map<String, Object>> nodeMap,
            String rootId, Map<String, Object> vars) {
        List<VisualizationNode> nodes = new ArrayList<>();
        if (nodeMap == null || nodeMap.isEmpty())
            return nodes;

        // BFS from root to assign proper tree positions
        Set<String> visited = new HashSet<>();
        Queue<String[]> queue = new LinkedList<>(); // [nodeId, parentId, side]
        queue.add(new String[] { rootId, null, null });

        int index = 0;
        while (!queue.isEmpty()) {
            String[] item = queue.poll();
            String nodeId = item[0];
            if (nodeId == null || !nodeMap.containsKey(nodeId) || visited.contains(nodeId))
                continue;
            visited.add(nodeId);

            Map<String, Object> data = nodeMap.get(nodeId);
            Object val = data.get("val");
            if (val instanceof Map)
                val = stringify(val);

            String leftId = (String) data.get("left");
            String rightId = (String) data.get("right");

            nodes.add(VisualizationNode.builder()
                    .id(nodeId)
                    .value(val)
                    .left(leftId)
                    .right(rightId)
                    .state("default")
                    .x(0)  // Frontend computes layout from tree structure
                    .y(0)
                    .pointers(new ArrayList<>())
                    .build());

            if (leftId != null)
                queue.add(new String[] { leftId, nodeId, "left" });
            if (rightId != null)
                queue.add(new String[] { rightId, nodeId, "right" });
            index++;
        }

        // Highlight pointers (variables pointing to tree nodes)
        highlightPointers(nodes, vars);

        return nodes;
    }

    /**
     * Detect the most common data structure type across all steps.
     * Used by JavaExecutionService to set the response-level dataStructure.
     */
    public String detectPrimaryDs(List<ExecutionStep> steps) {
        Map<String, Integer> dsCount = new HashMap<>();
        for (ExecutionStep step : steps) {
            if (step.getVisualizations() != null) {
                for (Visualization viz : step.getVisualizations()) {
                    String ds = viz.getDataStructure();
                    if (ds != null) {
                        dsCount.merge(ds, 1, Integer::sum);
                    }
                }
            }
        }
        if (dsCount.isEmpty())
            return "array";
        // Return the most frequently occurring DS
        return dsCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("array");
    }
}
