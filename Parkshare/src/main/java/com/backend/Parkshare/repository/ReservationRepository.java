package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.Reservation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends MongoRepository<Reservation, String> {

    // Excludes cancelled reservations — otherwise a cancelled booking would
    // keep blocking its slot forever, making the refund pointless. $ne (not
    // plain `false`) so reservations written before this field existed —
    // where it's simply absent — still count as not-cancelled.
    @Query("{'parkingSpace.id': ?0, 'startTime': {$lt: ?2}, 'endTime': {$gt: ?1}, 'cancelled': {$ne: true}}")
    List<Reservation> findByParkingSpaceIdAndTimeRange(String parkingSpaceId, LocalDateTime start, LocalDateTime end);

    List<Reservation> findByUserEmailOrderByStartTimeDesc(String userEmail);

    List<Reservation> findByHostEmailOrderByStartTimeDesc(String hostEmail);
}
