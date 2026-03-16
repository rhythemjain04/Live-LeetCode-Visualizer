package com.codestep.visualizer.controller;

import com.codestep.visualizer.model.ExecutionRequest;
import com.codestep.visualizer.model.ExecutionResponse;
import com.codestep.visualizer.service.JavaExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ExecutionController {

    private final JavaExecutionService javaExecutionService;

    @Autowired
    public ExecutionController(JavaExecutionService javaExecutionService) {
        this.javaExecutionService = javaExecutionService;
    }

    @PostMapping("/execute")
    public ExecutionResponse execute(@RequestBody ExecutionRequest request) {
        // Accept requests for any language, but always execute via JavaExecutionService
        return javaExecutionService.execute(request);
    }
}
