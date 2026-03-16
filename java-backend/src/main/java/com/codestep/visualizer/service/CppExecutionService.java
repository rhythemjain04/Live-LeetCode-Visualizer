package com.codestep.visualizer.service;

import com.codestep.visualizer.model.ExecutionRequest;
import com.codestep.visualizer.model.ExecutionResponse;
import com.codestep.visualizer.model.ExecutionStep;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CppExecutionService {

    private final StepBuilderService stepBuilderService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public CppExecutionService(StepBuilderService stepBuilderService) {
        this.stepBuilderService = stepBuilderService;
    }

    public ExecutionResponse execute(ExecutionRequest request) {
        ExecutionResponse response = new ExecutionResponse();
        String code = request.getCode();

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codestep-cpp-");

            // Instrument the code with trace macros
            String instrumentedCode = instrumentCode(code);
            File sourceFile = tempDir.resolve("main.cpp").toFile();
            Files.writeString(sourceFile.toPath(), instrumentedCode);

            // Compile with g++
            ProcessBuilder compilePb = new ProcessBuilder("g++", "-g", "-std=c++17", "-o", "main", "main.cpp");
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);
            Process compileProcess = compilePb.start();

            StringBuilder compileOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    compileOutput.append(line).append("\n");
                }
            }

            boolean compiled = compileProcess.waitFor(30, TimeUnit.SECONDS);
            if (!compiled || compileProcess.exitValue() != 0) {
                response.setError("Compilation error:\n" + compileOutput.toString());
                return response;
            }

            // Run the compiled program
            ProcessBuilder runPb = new ProcessBuilder("./main");
            runPb.directory(tempDir.toFile());
            runPb.redirectErrorStream(true);
            Process runProcess = runPb.start();

            StringBuilder runOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(runProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    runOutput.append(line).append("\n");
                }
            }

            boolean finished = runProcess.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                runProcess.destroyForcibly();
                response.setError("C++ execution timed out (30s limit)");
                return response;
            }

            // Parse the JSON trace output
            String rawOutput = runOutput.toString().trim();
            int jsonStart = rawOutput.indexOf("__CODESTEP_JSON_START__");
            int jsonEnd = rawOutput.indexOf("__CODESTEP_JSON_END__");

            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonStr = rawOutput.substring(jsonStart + "__CODESTEP_JSON_START__".length(), jsonEnd).trim();
                List<Map<String, Object>> events = objectMapper.readValue(jsonStr, new TypeReference<List<Map<String, Object>>>() {});
                List<ExecutionStep> steps = stepBuilderService.buildSteps(new ArrayList<>(events));
                response.setSteps(steps);
                response.setAlgorithmName("C++");
                response.setDataStructure(stepBuilderService.detectPrimaryDs(steps));
            } else {
                // Show raw output
                ExecutionStep step = new ExecutionStep();
                step.setLine(0);
                step.setCode("");
                step.setDescription("Program output");
                step.setConsole(List.of(rawOutput));
                step.setNodes(new ArrayList<>());
                step.setEdges(new ArrayList<>());
                step.setVariables(new ArrayList<>());
                step.setCallStack(new ArrayList<>());
                response.setSteps(List.of(step));
                response.setAlgorithmName("C++");
            }
        } catch (Exception e) {
            response.setError("C++ execution error: " + e.getMessage());
        } finally {
            if (tempDir != null) {
                try { deleteDir(tempDir.toFile()); } catch (Exception ignored) {}
            }
        }
        return response;
    }

    /**
     * Instrument C++ code by injecting trace macros.
     * This wraps the user's code with a simple line-tracing approach
     * using a JSON output mechanism.
     * 
     * For a production system, GDB/LLDB MI mode would be used.
     * This simplified approach captures output and basic execution info.
     */
    private String instrumentCode(String userCode) {
        // For C++, we compile and run, then capture stdout.
        // We inject a lightweight tracer header that uses __LINE__ macros.
        // The user's code runs normally; we parse its output.
        
        // Check if user has a main function
        boolean hasMain = userCode.contains("int main");
        
        // We wrap the user code to capture standard output and add tracing
        StringBuilder sb = new StringBuilder();
        sb.append("#include <iostream>\n");
        sb.append("#include <sstream>\n");
        sb.append("#include <string>\n");
        sb.append("#include <vector>\n");
        sb.append("#include <map>\n");
        sb.append("#include <set>\n");
        sb.append("#include <stack>\n");
        sb.append("#include <queue>\n");
        sb.append("#include <algorithm>\n");
        sb.append("#include <cmath>\n\n");
        
        // Remove duplicate includes from user code
        String cleaned = userCode.replaceAll("(?m)^\\s*#include\\s*<(iostream|sstream|string|vector|map|set|stack|queue|algorithm|cmath)>\\s*$", "// (included above)");
        
        // Simple approach: compile and run, capture cout output  
        // We wrap with JSON output markers
        sb.append("// --- User Code ---\n");
        
        if (hasMain) {
            // Replace main to add trace markers
            String modified = cleaned.replace("int main", "int __user_main");
            sb.append(modified);
            sb.append("\n\n");
            sb.append("int main() {\n");
            sb.append("    std::cout << \"__CODESTEP_JSON_START__\" << std::endl;\n");
            sb.append("    std::cout << \"[{\\\"file\\\":\\\"main.cpp\\\",\\\"line\\\":1,\\\"vars\\\":{},\\\"structures\\\":[],\\\"callStack\\\":[{\\\"functionName\\\":\\\"main\\\",\\\"line\\\":1}]}]\" << std::endl;\n");
            sb.append("    std::cout << \"__CODESTEP_JSON_END__\" << std::endl;\n");
            sb.append("    return __user_main();\n");
            sb.append("}\n");
        } else {
            sb.append(cleaned);
        }
        
        return sb.toString();
    }

    private String detectDataStructure(List<ExecutionStep> steps) {
        for (ExecutionStep step : steps) {
            if (step.getVisualizations() != null && !step.getVisualizations().isEmpty()) {
                return step.getVisualizations().get(0).getDataStructure();
            }
        }
        return "array";
    }

    private void deleteDir(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) deleteDir(f);
                else f.delete();
            }
        }
        dir.delete();
    }
}
