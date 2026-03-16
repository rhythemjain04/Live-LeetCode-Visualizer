package com.codestep.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
public class StackFrame {
    private String functionName;
    private int line;
    private List<Variable> variables;
}
