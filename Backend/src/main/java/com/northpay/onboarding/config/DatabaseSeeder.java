package com.northpay.onboarding.config;

import com.northpay.onboarding.model.Role;
import com.northpay.onboarding.model.User;
import com.northpay.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("Seeding default data into empty H2 database...");

            // Create default operator admin@northpay.com / admin123
            User admin = User.builder()
                    .email("admin@northpay.com")
                    .password("admin123")
                    .role(Role.OPERATOR)
                    .build();
            userRepository.save(admin);

            // Create default contractor contractor@northpay.com / password123
            User contractor = User.builder()
                    .email("contractor@northpay.com")
                    .password("password123")
                    .role(Role.CONTRACTOR)
                    .build();
            userRepository.save(contractor);

            log.info("Successfully seeded default administrator and contractor accounts.");
        }
    }
}
