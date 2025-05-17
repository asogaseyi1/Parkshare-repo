package com.backend.Parkshare.config;

import io.github.cdimascio.dotenv.Dotenv;

public class DotenvInitializer {
    public static void init() {
        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        System.setProperty("STRIPE_SECRET_KEY", dotenv.get("STRIPE_SECRET_KEY"));
    }
}
