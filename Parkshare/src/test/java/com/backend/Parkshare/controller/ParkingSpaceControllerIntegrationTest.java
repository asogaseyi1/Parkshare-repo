package com.backend.Parkshare.controller;

import com.backend.Parkshare.config.TestSecurityConfig;
import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Import(TestSecurityConfig.class)
public class ParkingSpaceControllerIntegrationTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0");

    @DynamicPropertySource
    static void overrideMongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ParkingSpaceRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    private static String createdId;

    @BeforeEach
    public void setup() {
        repository.deleteAll();
    }

    @Test
    @Order(1)
    public void testCreateParkingSpace() throws Exception {
        ParkingSpaceRequest request = new ParkingSpaceRequest();
        request.setOwnerEmail("test@example.com");
        request.setTitle("Test Spot");
        request.setDescription("Great parking spot!");
        request.setLocation(new GeoJsonPoint(-79.3832, 43.6532));
        request.setPricePerHour(5.0);
        request.setAvailableFrom(LocalDateTime.now());
        request.setAvailableTo(LocalDateTime.now().plusDays(1));

        String response = mockMvc.perform(post("/api/parking-spaces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Spot"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        createdId = objectMapper.readTree(response).get("id").asText();
        Assertions.assertNotNull(createdId);
    }

    @Test
    @Order(2)
    public void testGetParkingSpaceById() throws Exception {
        ParkingSpace space = new ParkingSpace();
        space.setOwnerEmail("test@example.com");
        space.setTitle("Lookup Spot");
        space.setDescription("Find me!");
        space.setLocation(new GeoJsonPoint(-79.3832, 43.6532));
        space.setPricePerHour(4.0);
        space.setAvailableFrom(LocalDateTime.now());
        space.setAvailableTo(LocalDateTime.now().plusHours(3));
        space.setCreatedAt(LocalDateTime.now());
        space.setUpdatedAt(LocalDateTime.now());

        ParkingSpace saved = repository.save(space);

        mockMvc.perform(get("/api/parking-spaces/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Lookup Spot"));
    }

    @Test
    @Order(3)
    public void testDeleteParkingSpace() throws Exception {
        ParkingSpace space = new ParkingSpace();
        space.setOwnerEmail("deleteme@example.com");
        space.setTitle("To Delete");
        space.setDescription("This one will be deleted");
        space.setLocation(new GeoJsonPoint(-79.0, 43.0));
        space.setPricePerHour(3.0);
        space.setAvailableFrom(LocalDateTime.now());
        space.setAvailableTo(LocalDateTime.now().plusHours(2));
        space.setCreatedAt(LocalDateTime.now());
        space.setUpdatedAt(LocalDateTime.now());

        ParkingSpace saved = repository.save(space);

        mockMvc.perform(delete("/api/parking-spaces/" + saved.getId()))
                .andExpect(status().isNoContent());
    }
}
