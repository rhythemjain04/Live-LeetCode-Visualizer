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
public class Visualization {
    private String title;
    private String dataStructure;
    private List<VisualizationNode> nodes;
    private List<Edge> edges;
}
