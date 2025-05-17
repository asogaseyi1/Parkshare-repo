package com.backend.Parkshare.config;

import com.stripe.Stripe;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class StripeInitializer {

    @PostConstruct
    public void init() {
        Dotenv dotenv = Dotenv.configure()
                .directory("./Parkshare") // or simply `.load()` if .env is in root
                .ignoreIfMissing()
                .load();

        String apiKey = dotenv.get("STRIPE_SECRET_KEY");

        if (apiKey != null && !apiKey.isEmpty()) {
            Stripe.apiKey = apiKey;
        } else {
            throw new IllegalStateException("STRIPE_SECRET_KEY not found in .env");
        }
    }
}
