package com.backend.Parkshare;

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
		SpringApplication.run(ParkshareApplication.class, args);
	}

	@Bean
	CommandLineRunner runner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			User user = new User();
			user.setName("John Doe");
			user.setEmail("john@example.com");
			user.setPassword(passwordEncoder.encode("password123"));
			user.setPhoneNumber("1234567890");
			user.setRoles(List.of("USER"));

			userRepository.save(user);

			System.out.println("Sample user created: " + user.getEmail());
		};
	}

}
