package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.Reservation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends MongoRepository<Reservation, String> {

    @Query("{'parkingSpace.id': ?0, 'startTime': {$lt: ?2}, 'endTime': {$gt: ?1}}")
    List<Reservation> findByParkingSpaceIdAndTimeRange(String parkingSpaceId, LocalDateTime start, LocalDateTime end);
}
