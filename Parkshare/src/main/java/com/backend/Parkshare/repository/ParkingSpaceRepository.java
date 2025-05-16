package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.ParkingSpace;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSpaceRepository extends MongoRepository<ParkingSpace, String> {
    List<ParkingSpace> findByOwnerEmail(String ownerEmail);
}
