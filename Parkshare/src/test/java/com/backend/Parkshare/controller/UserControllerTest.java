package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.LoginRequest;
import com.backend.Parkshare.dto.LoginResponse;
import com.backend.Parkshare.dto.RegisterRequest;
import com.backend.Parkshare.model.User;
import com.backend.Parkshare.repository.UserRepository;
import com.backend.Parkshare.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserControllerTest {

    @InjectMocks
    private UserController userController;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterNewUserReturnsSuccess() {
        RegisterRequest req = new RegisterRequest();
        req.name = "John";
        req.email = "john@example.com";
        req.password = "password";
        req.phoneNumber = "1234567890";
        req.roles = List.of("USER");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encodedPwd");

        String result = userController.register(req);

        assertEquals("User registered successfully.", result);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testLoginWithValidCredentialsReturnsToken() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password");

        User user = new User();
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setPassword("encodedPassword");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("john@example.com")).thenReturn("mockedToken");

        ResponseEntity<?> response = userController.login(loginRequest);

        assertEquals(200, response.getStatusCodeValue());
        LoginResponse loginResponse = (LoginResponse) response.getBody();
        assertEquals("Bearer mockedToken", loginResponse.getToken());
        assertEquals("John Doe", loginResponse.getName());
    }

    @Test
    void testLoginWithInvalidCredentialsReturnsUnauthorized() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("wrongpassword");

        User user = new User();
        user.setEmail("john@example.com");
        user.setPassword("encodedPassword");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        ResponseEntity<?> response = userController.login(loginRequest);

        assertEquals(401, response.getStatusCodeValue());
        assertEquals("Invalid email or password.", response.getBody());
    }

    @Test
    void testRegisterWithNewUserReturnsSuccessMessage() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.name = "Alice";
        registerRequest.email = "alice@example.com";
        registerRequest.password = "securepassword";
        registerRequest.phoneNumber = "1234567890";
        registerRequest.roles = List.of("USER");

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("securepassword")).thenReturn("encodedPassword");

        String result = userController.register(registerRequest);

        assertEquals("User registered successfully.", result);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterWithExistingEmailReturnsUserAlreadyExistsMessage() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.name = "Bob";
        registerRequest.email = "bob@example.com";
        registerRequest.password = "password123";
        registerRequest.phoneNumber = "9876543210";
        registerRequest.roles = List.of("USER");

        User existingUser = new User();
        existingUser.setEmail("bob@example.com");

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(existingUser));

        String result = userController.register(registerRequest);

        assertEquals("User already exists.", result);
        verify(userRepository, never()).save(any(User.class));
    }
}
