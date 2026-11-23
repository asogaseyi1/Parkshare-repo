package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.UserDiscount;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserDiscountRepository extends MongoRepository<UserDiscount, String> {
    Optional<UserDiscount> findByParkingSpaceIdAndGuestEmail(String parkingSpaceId, String guestEmail);

    List<UserDiscount> findByParkingSpaceId(String parkingSpaceId);

    void deleteAllByParkingSpaceId(String parkingSpaceId);
}
