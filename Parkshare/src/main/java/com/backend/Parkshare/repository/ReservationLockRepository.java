package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.ReservationLock;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReservationLockRepository extends MongoRepository<ReservationLock, String> {
}
