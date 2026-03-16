package com.codestep.visualizer.model;

import lombok.Data;

@Data
public class ExecutionRequest {
    private String code;
    private String language;
    private String input;
}
