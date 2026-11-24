package com.backend.Parkshare;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ParkshareApplication {

	public static void main(String[] args) {
		loadMongoUriFromDotenv();
		SpringApplication.run(ParkshareApplication.class, args);
	}

	// application.properties resolves spring.data.mongodb.uri=${MONGODB_URI}
	// while the environment is being prepared, well before any @PostConstruct
	// bean (like StripeInitializer) would run — so unlike the Stripe key, this
	// has to be read from .env and injected here, before SpringApplication.run.
	// An already-set env var or -D system property (e.g. in tests/CI) wins.
	private static void loadMongoUriFromDotenv() {
		if (System.getProperty("MONGODB_URI") != null || System.getenv("MONGODB_URI") != null) {
			return;
		}

		Dotenv dotenv = Dotenv.configure().directory(".").ignoreIfMissing().load();
		String mongoUri = dotenv.get("MONGODB_URI");
		if (mongoUri != null && !mongoUri.isEmpty()) {
			System.setProperty("MONGODB_URI", mongoUri);
		}
	}

}
