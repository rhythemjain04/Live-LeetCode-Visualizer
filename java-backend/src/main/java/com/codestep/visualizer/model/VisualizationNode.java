package com.codestep.visualizer.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisualizationNode {
    private String id;
    private Object value; // Can be String or Integer or JSON String
    private String state; // default, active, visited, etc.
    private int x;
    private int y;
    
    // Pointers for data structures
    private String next;
    private String prev;
    private String left;
    private String right;
    
    // List of pointers pointing to this node (head, fast, slow, etc.)
    private List<String> pointers;
}
