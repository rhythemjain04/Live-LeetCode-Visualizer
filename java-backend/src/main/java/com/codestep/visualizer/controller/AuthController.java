package com.codestep.visualizer.controller;

import com.codestep.visualizer.model.AppUser;
import com.codestep.visualizer.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // Demo credentials (no DB needed)
    private static final String DEMO_EMAIL = "demo@algo.viz";
    private static final String DEMO_PASSWORD = "password";

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * POST /api/auth/login
     * Body: { "email": "...", "password": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        // Check demo user first (works without DB)
        if (DEMO_EMAIL.equalsIgnoreCase(email) && DEMO_PASSWORD.equals(password)) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "email", DEMO_EMAIL,
                    "name", "Demo User"
            ));
        }

        // Check DB users
        var userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            if (encoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "email", user.getEmail(),
                        "name", user.getDisplayName() != null ? user.getDisplayName() : user.getEmail()
                ));
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    /**
     * POST /api/auth/register
     * Body: { "email": "...", "password": "...", "name": "..." }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        email = email.toLowerCase().trim();

        // Block registering over the demo account
        if (DEMO_EMAIL.equalsIgnoreCase(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot register with demo email"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        AppUser user = AppUser.builder()
                .email(email)
                .passwordHash(encoder.encode(password))
                .displayName(name != null ? name.trim() : email)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "email", user.getEmail(),
                "name", user.getDisplayName()
        ));
    }
}
