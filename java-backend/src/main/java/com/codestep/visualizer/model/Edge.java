package com.codestep.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Edge {
    private VisualizationNode from;
    private VisualizationNode to;
}
