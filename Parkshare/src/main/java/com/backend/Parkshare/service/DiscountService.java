package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.UserDiscountRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.UserDiscount;
import com.backend.Parkshare.repository.UserDiscountRepository;
import com.backend.Parkshare.repository.UserRepository;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DiscountService {

    private final UserDiscountRepository repository;
    private final UserRepository userRepository;
    private final ParkingSpaceService parkingSpaceService;
    private final MongoTemplate mongoTemplate;

    public DiscountService(UserDiscountRepository repository, UserRepository userRepository,
                            ParkingSpaceService parkingSpaceService, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.parkingSpaceService = parkingSpaceService;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Upserts rather than create-or-reject, so granting a discount again to the
     * same guest just updates the percentage. Uses an atomic findAndModify
     * (not a repository find-then-save) so a double-submit can't create two
     * rows for the same (parkingSpaceId, guestEmail) — the compound unique
     * index in MongoIndexInitializer is a backstop behind this, not the only
     * guard.
     */
    public UserDiscount create(String parkingSpaceId, String callerEmail, UserDiscountRequest request) {
        ParkingSpace space = parkingSpaceService.requireOwnership(parkingSpaceId, callerEmail);

        userRepository.findByEmail(request.getGuestEmail())
                .orElseThrow(() -> new BadRequestException(
                        "No account exists for '" + request.getGuestEmail() + "' — they need to register first."));

        Query query = Query.query(Criteria.where("parkingSpaceId").is(parkingSpaceId)
                .and("guestEmail").is(request.getGuestEmail()));
        Update update = new Update()
                .set("percentOff", request.getPercentOff())
                .set("ownerEmail", space.getOwnerEmail())
                .setOnInsert("parkingSpaceId", parkingSpaceId)
                .setOnInsert("guestEmail", request.getGuestEmail())
                .setOnInsert("createdAt", LocalDateTime.now());

        return mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().upsert(true).returnNew(true), UserDiscount.class);
    }

    /** Owner-only — who got a discount is private to the host. */
    public List<UserDiscount> list(String parkingSpaceId, String callerEmail) {
        parkingSpaceService.requireOwnership(parkingSpaceId, callerEmail);
        return repository.findByParkingSpaceId(parkingSpaceId);
    }

    public void delete(String parkingSpaceId, String discountId, String callerEmail) {
        parkingSpaceService.requireOwnership(parkingSpaceId, callerEmail);

        UserDiscount discount = repository.findById(discountId)
                .orElseThrow(() -> new NotFoundException("Discount not found"));
        if (!discount.getParkingSpaceId().equals(parkingSpaceId)) {
            throw new NotFoundException("Discount not found");
        }

        repository.deleteById(discountId);
    }
}
