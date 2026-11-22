package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.dto.PriceBreakdown;
import com.backend.Parkshare.exception.GlobalExceptionHandler;
import com.backend.Parkshare.service.ParkingSpaceService;
import com.backend.Parkshare.service.PricingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.data.mongodb.core.geo.GeoJsonModule;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
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
    private PricingService mockPricingService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        this.mockService = mock(ParkingSpaceService.class);
        this.mockPricingService = mock(PricingService.class);
        ParkingSpaceController controller = new ParkingSpaceController(mockService, mockPricingService);

        // Plain ObjectMapper(), unlike Spring's auto-configured one, has neither the
        // JSR-310 module (for LocalDateTime) nor Spring Data Mongo's GeoJsonModule
        // (for GeoJsonPoint) registered by default — both are needed now that the
        // request carries those fields (added when @Valid was turned on for this
        // endpoint). The same mapper is wired into MockMvc's own message converter
        // below, since that — not this test's local copy — is what deserializes the
        // @RequestBody server-side.
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .registerModule(new GeoJsonModule());

        this.mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                // Real Spring auto-detects @RestControllerAdvice; standalone mode doesn't,
                // so NotFoundException etc. need it added explicitly to get the same
                // mapped status codes this test asserts on.
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
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
        request.setLocation(new GeoJsonPoint(-79.3832, 43.6532));
        request.setCountry("CA");
        request.setPricePerHour(5.0);
        request.setAvailableFrom(LocalDateTime.now());
        request.setAvailableTo(LocalDateTime.now().plusHours(2));

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
    public void testCreateParkingSpace_missingRequiredFieldsReturnsBadRequest() throws Exception {
        ParkingSpaceRequest request = new ParkingSpaceRequest();
        request.setOwnerEmail("test@example.com");
        request.setTitle("Test Space");
        // location, pricePerHour, availableFrom, availableTo intentionally left unset.

        mockMvc.perform(post("/api/parking-spaces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(mockService, never()).createParkingSpace(any(ParkingSpaceRequest.class));
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

    @Test
    public void testGetPriceQuote() throws Exception {
        ParkingSpaceResponse space = new ParkingSpaceResponse();
        space.setPricePerHour(5.0);
        space.setCountry("CA");
        when(mockService.getParkingSpaceById("abc")).thenReturn(Optional.of(space));

        PriceBreakdown quote = new PriceBreakdown();
        quote.setTotalCharged(11.80);
        when(mockPricingService.quote(eq(5.0), eq("CA"), any(), any())).thenReturn(quote);

        mockMvc.perform(get("/api/parking-spaces/abc/price-quote")
                        .param("startTime", "2026-01-01T09:00:00")
                        .param("endTime", "2026-01-01T11:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCharged").value(11.80));
    }

    @Test
    public void testGetPriceQuote_unknownSpaceReturnsNotFound() throws Exception {
        when(mockService.getParkingSpaceById("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/parking-spaces/missing/price-quote")
                        .param("startTime", "2026-01-01T09:00:00")
                        .param("endTime", "2026-01-01T11:00:00"))
                .andExpect(status().isNotFound());
    }
}


