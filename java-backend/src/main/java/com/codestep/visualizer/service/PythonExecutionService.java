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

@Service
public class PythonExecutionService {

    private final StepBuilderService stepBuilderService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public PythonExecutionService(StepBuilderService stepBuilderService) {
        this.stepBuilderService = stepBuilderService;
    }

    public ExecutionResponse execute(ExecutionRequest request) {
        ExecutionResponse response = new ExecutionResponse();
        String code = request.getCode();

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codestep-python-");

            // Write the tracer script that instruments the user's code
            String tracerScript = buildTracerScript(code);
            File tracerFile = tempDir.resolve("tracer.py").toFile();
            Files.writeString(tracerFile.toPath(), tracerScript);

            // Run the tracer with python3
            ProcessBuilder pb = new ProcessBuilder("python3", tracerFile.getAbsolutePath());
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                response.setError("Python execution timed out (30s limit)");
                return response;
            }

            // Parse the JSON output from the tracer
            String rawOutput = output.toString().trim();
            int jsonStart = rawOutput.indexOf("__CODESTEP_JSON_START__");
            int jsonEnd = rawOutput.indexOf("__CODESTEP_JSON_END__");

            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonStr = rawOutput.substring(jsonStart + "__CODESTEP_JSON_START__".length(), jsonEnd).trim();
                List<Map<String, Object>> events = objectMapper.readValue(jsonStr, new TypeReference<List<Map<String, Object>>>() {});

                List<ExecutionStep> steps = stepBuilderService.buildSteps(new ArrayList<>(events));
                response.setSteps(steps);
                response.setAlgorithmName(extractFunctionName(code));
                response.setDataStructure(stepBuilderService.detectPrimaryDs(steps));
            } else {
                // No trace data — just show raw output
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
                response.setAlgorithmName("Python");
            }
        } catch (Exception e) {
            response.setError("Python execution error: " + e.getMessage());
        } finally {
            if (tempDir != null) {
                try { deleteDir(tempDir.toFile()); } catch (Exception ignored) {}
            }
        }
        return response;
    }

    /**
     * Generate a Python tracer script that uses sys.settrace to capture
     * variable state at each line execution in the user's code.
     */
    private String buildTracerScript(String userCode) {
        // Escape the user code for embedding in a Python triple-quoted string
        // We use triple quotes so we only need to escape triple-quote sequences
        String escapedCode = userCode.replace("\\", "\\\\").replace("\"\"\"", "\\\"\\\"\\\"");

        return """
import sys
import json
import copy

__events = []
__user_file = "<user_code>"
__max_steps = 500
__step_count = 0

def __classify_kind(name, val):
    tname = type(val).__name__
    if isinstance(val, list):
        if name and any(kw in name.lower() for kw in ['graph', 'adj', 'edge', 'neighbor']):
            return 'graph'
        if len(val) > 0 and isinstance(val[0], list):
            return 'array'
        return 'array'
    if isinstance(val, dict):
        return 'hashmap'
    if isinstance(val, set):
        return 'hashset'
    if isinstance(val, tuple):
        return 'array'
    if tname == 'deque':
        return 'queue'
    return None

def __snapshot_vars(frame):
    local_vars = {}
    structures = []
    for name, val in frame.f_locals.items():
        if name.startswith('_'):
            continue
        kind = __classify_kind(name, val)
        if kind:
            values = list(val) if hasattr(val, '__iter__') and not isinstance(val, (str, dict)) else []
            if isinstance(val, dict):
                values = [f"{k}={v}" for k, v in val.items()]
            structures.append({"name": name, "kind": kind, "values": values})
            local_vars[name] = val
        else:
            try:
                json.dumps(val)
                local_vars[name] = val
            except (TypeError, ValueError):
                local_vars[name] = str(val)
    return local_vars, structures

def __trace_func(frame, event, arg):
    global __step_count
    if event != 'line':
        return __trace_func
    if __step_count >= __max_steps:
        return None

    co = frame.f_code
    if co.co_filename != __user_file:
        return __trace_func

    __step_count += 1
    local_vars, structures = __snapshot_vars(frame)

    call_stack = []
    f = frame
    while f:
        if f.f_code.co_filename == __user_file:
            call_stack.append({"functionName": f.f_code.co_name, "line": f.f_lineno})
        f = f.f_back

    __events.append({
        "file": co.co_filename,
        "line": frame.f_lineno,
        "vars": local_vars,
        "structures": structures,
        "callStack": call_stack
    })
    return __trace_func

# Compile and execute user code with tracing
__user_code = \"\"\""" + escapedCode + ""\"\"\"
__compiled = compile(__user_code, __user_file, 'exec')
sys.settrace(__trace_func)
try:
    exec(__compiled)
except Exception as e:
    __events.append({"file": "<user_code>", "line": 0, "vars": {"error": str(e)}, "structures": [], "callStack": []})
finally:
    sys.settrace(None)

print("__CODESTEP_JSON_START__")
print(json.dumps(__events, default=str))
print("__CODESTEP_JSON_END__")
""";
    }

    private String extractFunctionName(String code) {
        if (code.contains("def ")) {
            int idx = code.indexOf("def ");
            int paren = code.indexOf("(", idx);
            if (paren > idx) {
                return code.substring(idx + 4, paren).trim();
            }
        }
        return "Python";
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
