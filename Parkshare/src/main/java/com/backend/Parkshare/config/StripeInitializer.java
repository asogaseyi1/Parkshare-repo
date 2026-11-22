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
        // Looks for .env next to pom.xml — i.e. wherever the app is actually
        // launched from (`mvnw spring-boot:run` or `java -jar target/*.jar`,
        // both run with that as the working directory). A previous hardcoded
        // "./Parkshare" assumed being launched one level up, so it silently
        // never found the file when run the normal way.
        Dotenv dotenv = Dotenv.configure()
                .directory(".")
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
