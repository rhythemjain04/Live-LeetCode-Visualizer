package com.codestep.visualizer.controller;

import com.codestep.visualizer.model.ExecutionRequest;
import com.codestep.visualizer.model.ExecutionResponse;
import com.codestep.visualizer.service.CppExecutionService;
import com.codestep.visualizer.service.JavaExecutionService;
import com.codestep.visualizer.service.PythonExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ExecutionController {

    private final JavaExecutionService javaExecutionService;
    private final PythonExecutionService pythonExecutionService;
    private final CppExecutionService cppExecutionService;

    @Autowired
    public ExecutionController(
            JavaExecutionService javaExecutionService,
            PythonExecutionService pythonExecutionService,
            CppExecutionService cppExecutionService
    ) {
        this.javaExecutionService = javaExecutionService;
        this.pythonExecutionService = pythonExecutionService;
        this.cppExecutionService = cppExecutionService;
    }

    @PostMapping("/execute")
    public ExecutionResponse execute(@RequestBody ExecutionRequest request) {
        if (request.getLanguage() == null) {
            return javaExecutionService.execute(request);
        }

        return switch (request.getLanguage().toLowerCase()) {
            case "python" -> pythonExecutionService.execute(request);
            case "cpp", "c++" -> cppExecutionService.execute(request);
            case "java" -> javaExecutionService.execute(request);
            default -> {
                ExecutionResponse response = new ExecutionResponse();
                response.setError("Unsupported language: " + request.getLanguage());
                yield response;
            }
        };
    }
}
