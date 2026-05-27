package com.northpay.onboarding.config;

import com.northpay.onboarding.model.OperatorKey;
import com.northpay.onboarding.model.Role;
import com.northpay.onboarding.model.User;
import com.northpay.onboarding.repository.OperatorKeyRepository;
import com.northpay.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OperatorKeyRepository operatorKeyRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("Seeding default data into empty H2 database...");

            // Create default owner owner@northpay.com / LLAVE_DE_ORO_2026
            User owner = User.builder()
                    .email("owner@northpay.com")
                    .password("LLAVE_DE_ORO_2026")
                    .role(Role.OWNER)
                    .build();
            userRepository.save(owner);

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

            log.info("Successfully seeded default administrator, owner, and contractor accounts.");
        }

        if (operatorKeyRepository.count() == 0) {
            log.info("Generating 100 unique Operator activation secret keys...");
            List<OperatorKey> keys = new ArrayList<>();
            Random random = new Random();
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for (int i = 1; i <= 100; i++) {
                StringBuilder sb = new StringBuilder("NP-");
                // Generate 4 chars
                for (int j = 0; j < 4; j++) {
                    sb.append(chars.charAt(random.nextInt(chars.length())));
                }
                sb.append("-");
                // Generate 4 chars
                for (int j = 0; j < 4; j++) {
                    sb.append(chars.charAt(random.nextInt(chars.length())));
                }
                
                keys.add(OperatorKey.builder()
                        .secretKey(sb.toString())
                        .used(false)
                        .build());
            }
            operatorKeyRepository.saveAll(keys);
            log.info("Successfully generated 100 Operator keys.");
        }
    }
}
