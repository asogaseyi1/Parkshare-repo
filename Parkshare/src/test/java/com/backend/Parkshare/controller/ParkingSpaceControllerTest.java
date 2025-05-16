package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.service.ParkingSpaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@Import(ParkingSpaceControllerTest.TestConfig.class)
public class ParkingSpaceControllerTest {

    private MockMvc mockMvc;
    private ParkingSpaceService mockService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        this.mockService = mock(ParkingSpaceService.class);
        ParkingSpaceController controller = new ParkingSpaceController(mockService);
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        this.objectMapper = new ObjectMapper();
    }

    @Configuration
    static class TestConfig {
        @Bean
        public ParkingSpaceService parkingSpaceService() {
            return mock(ParkingSpaceService.class);
        }
    }

    @Test
    public void testCreateParkingSpace() throws Exception {
        ParkingSpaceRequest request = new ParkingSpaceRequest();
        request.setOwnerEmail("test@example.com");
        request.setTitle("Test Space");

        ParkingSpaceResponse response = new ParkingSpaceResponse();
        response.setTitle("Test Space");

        when(mockService.createParkingSpace(any(ParkingSpaceRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/parking-spaces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Space"));
    }

    @Test
    public void testGetAllParkingSpaces() throws Exception {
        ParkingSpaceResponse r1 = new ParkingSpaceResponse();
        r1.setTitle("A");

        ParkingSpaceResponse r2 = new ParkingSpaceResponse();
        r2.setTitle("B");

        when(mockService.getAllParkingSpaces()).thenReturn(List.of(r1, r2));

        mockMvc.perform(get("/api/parking-spaces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    public void testGetById_found() throws Exception {
        ParkingSpaceResponse res = new ParkingSpaceResponse();
        res.setTitle("Found");

        when(mockService.getParkingSpaceById("abc")).thenReturn(Optional.of(res));

        mockMvc.perform(get("/api/parking-spaces/abc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Found"));
    }

    @Test
    public void testGetById_notFound() throws Exception {
        when(mockService.getParkingSpaceById("notfound")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/parking-spaces/notfound"))
                .andExpect(status().isNotFound());
    }


}


