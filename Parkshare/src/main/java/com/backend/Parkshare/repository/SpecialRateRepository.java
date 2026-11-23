package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.SpecialRate;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SpecialRateRepository extends MongoRepository<SpecialRate, String> {
    List<SpecialRate> findByParkingSpaceId(String parkingSpaceId);

    void deleteAllByParkingSpaceId(String parkingSpaceId);
}
