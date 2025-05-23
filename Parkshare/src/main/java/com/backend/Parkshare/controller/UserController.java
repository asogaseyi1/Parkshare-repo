package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.LoginRequest;
import com.backend.Parkshare.dto.LoginResponse;
import com.backend.Parkshare.dto.RegisterRequest;
import com.backend.Parkshare.repository.UserRepository;
import com.backend.Parkshare.model.User;
import com.backend.Parkshare.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.email).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User already exists.");
        }

        User user = new User();
        user.setName(req.name);
        user.setEmail(req.email);
        user.setPassword(passwordEncoder.encode(req.password));
        user.setPhoneNumber(req.phoneNumber);
        user.setRoles(req.roles);

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully.");
    }


    // Login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(new LoginResponse("Bearer " + token, user.getName()));
    }

}
