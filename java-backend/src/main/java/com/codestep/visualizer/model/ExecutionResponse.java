package com.codestep.visualizer.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ExecutionResponse {
    private List<ExecutionStep> steps;
    private String dataStructure;
    private String algorithmName;
    private List<VariableInfo> variablesExtracted;
    private List<DataStructureInfo> dataStructuresDetected;
    private String error;
    private String message;
}

@Data
class VariableInfo {
    private String name;
    private String typeHint;
}

@Data
class DataStructureInfo {
    private String type;
    private String variable;
}
