package com.codestep.visualizer.model;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class ExecutionStep {
    private int line;
    private String code;
    private String description;
    private List<VisualizationNode> nodes = new ArrayList<>();
    private List<Edge> edges = new ArrayList<>();
    private List<Visualization> visualizations = new ArrayList<>();
    private List<Variable> variables = new ArrayList<>();
    private List<StackFrame> callStack = new ArrayList<>();
    private List<String> console = new ArrayList<>();
}
