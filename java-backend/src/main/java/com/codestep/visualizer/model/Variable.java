package com.codestep.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class Variable {
    private String name;
    private Object value;
    private String type;
    private boolean changed;
}
