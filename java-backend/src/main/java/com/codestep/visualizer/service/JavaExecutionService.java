package com.codestep.visualizer.service;

import com.codestep.visualizer.model.ExecutionRequest;
import com.codestep.visualizer.model.ExecutionResponse;
import com.codestep.visualizer.model.ExecutionStep;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class JavaExecutionService {

    private final JdiService jdiService;
    private final StepBuilderService stepBuilderService;

    @Autowired
    public JavaExecutionService(JdiService jdiService, StepBuilderService stepBuilderService) {
        this.jdiService = jdiService;
        this.stepBuilderService = stepBuilderService;
    }

    public ExecutionResponse execute(ExecutionRequest request) {
        ExecutionResponse response = new ExecutionResponse();
        String code = request.getCode();
        
        // Remove package declaration to avoid classpath issues
        code = code.replaceAll("(?m)^\\s*package\\s+.*?;", "");
        
        // Basic static analysis (simplified)
        // In a real scenario, use a parser or regex to find class name
        String className = extractClassName(code);
        if (className == null) className = "Main";
        className = className.split("\\s")[0];
//        className = className.replaceAll("\\s","");

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codestep-java-");
            File sourceFile = tempDir.resolve(className + ".java").toFile();
            Files.writeString(sourceFile.toPath(), code);

            // Compile
            ProcessBuilder javacPb = new ProcessBuilder("javac", "-g", sourceFile.getAbsolutePath());
            javacPb.directory(tempDir.toFile());
            Process javacProcess = javacPb.start();
            
            String compileError = new String(javacProcess.getErrorStream().readAllBytes());
            int javacExit = javacProcess.waitFor();
            
            if (javacExit != 0) {
                response.setError("Compilation failed");
                response.setMessage(compileError);
                return response;
            }

            // Run with JDI
            // We launch the user code in a separate process with JDWP agent
            // And then attach our JDI logic to it.
            // Actually, JdiService can handle the launching and attaching via LaunchingConnector
            
            List<Object> events = jdiService.debug(tempDir, className);
            
            // Convert to steps
            List<ExecutionStep> steps = stepBuilderService.buildSteps(events);
            response.setSteps(steps);
            response.setAlgorithmName(className);
            // Auto-detect primary data structure from the structures found in steps
            String detectedDs = stepBuilderService.detectPrimaryDs(steps);
            response.setDataStructure(detectedDs);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.setError("Execution failed: " + e.getMessage());
        } finally {
            // Cleanup tempDir
            if (tempDir != null) {
                deleteRecursively(tempDir.toFile());
            }
        }
        
        return response;
    }

    private String extractClassName(String code) {
        Pattern p = Pattern.compile("class\\s+([A-Za-z_][A-Za-z0-9_]*)");
        Matcher m = p.matcher(code);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private void deleteRecursively(File file) {
        if (file == null || !file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }
        file.delete();
    }
}
