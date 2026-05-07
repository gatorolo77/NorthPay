package com.northpay.onboarding.service;

import com.northpay.onboarding.model.*;
import com.northpay.onboarding.repository.InvitationRepository;
import com.northpay.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;

    @Transactional
    public Invitation createInvitation(String email, Long createdBy) {
        // Deactivate existing invitation for same email if any
        invitationRepository.findByEmail(email).ifPresent(inv -> {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(inv);
        });

        Invitation invitation = Invitation.builder()
                .email(email)
                .token(UUID.randomUUID().toString())
                .status(InvitationStatus.PENDING)
                .createdBy(createdBy)
                .expiresAt(LocalDateTime.now().plusDays(3)) // 3-day activation timeframe limit
                .build();

        return invitationRepository.save(invitation);
    }

    @Transactional
    public User registerWithToken(String email, String password, String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Invitation is no longer active");
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalStateException("Invitation has expired");
        }
        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Email does not match invitation recipient");
        }

        // Register user
        User user = User.builder()
                .email(email.toLowerCase())
                .password(password) // In a real production app we would encrypt this password
                .role(Role.CONTRACTOR)
                .build();
        User savedUser = userRepository.save(user);

        // Consume invitation
        invitation.setStatus(InvitationStatus.USED);
        invitationRepository.save(invitation);

        log.info("User registered successfully via invitation token: {}", email);
        return savedUser;
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return user;
    }
}
