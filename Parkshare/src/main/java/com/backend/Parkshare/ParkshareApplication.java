package com.backend.Parkshare;

import com.backend.Parkshare.config.DotenvInitializer;
import com.backend.Parkshare.model.User;
import com.backend.Parkshare.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication
public class ParkshareApplication {

	public static void main(String[] args) {
		DotenvInitializer.init();
		SpringApplication.run(ParkshareApplication.class, args);
	}

}
