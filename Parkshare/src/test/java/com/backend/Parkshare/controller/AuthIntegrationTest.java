package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.*;
import com.backend.Parkshare.model.User;
import com.backend.Parkshare.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthIntegrationTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0");

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeAll
    static void setUpContainer() {
        mongoDBContainer.start();
        System.setProperty("spring.data.mongodb.uri", mongoDBContainer.getReplicaSetUrl());
    }

    @BeforeEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/auth";
    }

    @Test
    @Order(1)
    void testRegisterIntegration() {
        RegisterRequest req = new RegisterRequest();
        req.name = "Alice";
        req.email = "alice@example.com";
        req.password = "password";
        req.phoneNumber = "1234567890";
        req.roles = List.of("USER");

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/register", req, String.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("User registered successfully."));
        assertNotNull(userRepository.findByEmail("alice@example.com"));
    }

    @Test
    @Order(2)
    void testLoginIntegration() {
        // Pre-register a user directly
        User user = new User();
        user.setName("Bob");
        user.setEmail("bob@example.com");
        user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("secret"));
        user.setPhoneNumber("9876543210");
        user.setRoles(List.of("USER"));
        userRepository.save(user);

        LoginRequest login = new LoginRequest();
        login.setEmail("bob@example.com");
        login.setPassword("secret");

        ResponseEntity<LoginResponse> response = restTemplate.postForEntity(getBaseUrl() + "/login", login, LoginResponse.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getToken().startsWith("Bearer "));
        assertEquals("Bob", response.getBody().getName());
    }
}
