package com.northpay.onboarding.service;

import com.northpay.onboarding.model.*;
import com.northpay.onboarding.repository.InvitationRepository;
import com.northpay.onboarding.repository.OperatorKeyRepository;
import com.northpay.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final OperatorKeyRepository operatorKeyRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public Invitation createInvitation(String email, Long createdBy) {
        Invitation invitation = invitationRepository.findByEmail(email)
                .orElseGet(() -> Invitation.builder().email(email).build());

        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setCreatedBy(createdBy);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(3)); // 3-day activation timeframe limit

        Invitation saved = invitationRepository.save(invitation);

        // Send email asynchronously or catch exceptions to prevent crash if SMTP is not configured yet
        emailService.sendInvitationEmail(email, saved.getToken());

        return saved;
    }

    @Transactional
    public User registerWithToken(String email, String password, String token, String secretKey) {
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

        if (userRepository.findByEmail(email.toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("El usuario con este correo electrónico ya se encuentra registrado.");
        }

        // Validate operator secret key if role is OPERATOR
        if (invitation.getRole() == Role.OPERATOR) {
            if (secretKey == null || secretKey.trim().isEmpty()) {
                throw new IllegalArgumentException("Se requiere una clave secreta autorizada por el Propietario (Owner) para registrar un operador.");
            }
            String cleanKey = secretKey.trim().toUpperCase();
            OperatorKey opKey = operatorKeyRepository.findBySecretKey(cleanKey)
                    .orElseThrow(() -> new IllegalArgumentException("Clave secreta inválida. Contactá al administrador de NorthPay."));

            if (opKey.getUsed()) {
                throw new IllegalArgumentException("La clave secreta ingresada ya ha sido utilizada.");
            }

            // Consume secret key
            opKey.setUsed(true);
            opKey.setUsedByEmail(email.toLowerCase());
            opKey.setUsedAt(LocalDateTime.now());
            operatorKeyRepository.save(opKey);
        }

        // Register user
        User user = User.builder()
                .email(email.toLowerCase())
                .password(password) // In a real production app we would encrypt this password
                .role(invitation.getRole())
                .build();
        User savedUser = userRepository.save(user);

        // Consume invitation
        invitation.setStatus(InvitationStatus.USED);
        invitationRepository.save(invitation);

        log.info("User registered successfully via invitation token: {} | Role: {}", email, invitation.getRole());
        return savedUser;
    }

    @Transactional
    public Invitation createOperatorInvitation(String email) {
        Invitation invitation = invitationRepository.findByEmail(email)
                .orElseGet(() -> Invitation.builder().email(email).build());

        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setCreatedBy(0L); // System level
        invitation.setExpiresAt(LocalDateTime.now().plusDays(3)); // 3-day activation limit
        invitation.setRole(Role.OPERATOR);

        Invitation saved = invitationRepository.save(invitation);

        // Send notification to Owner under their notification bell
        userRepository.findByEmail("owner@northpay.com").ifPresent(owner -> {
            notificationService.sendNotification(
                    owner.getId(),
                    "El operador " + email + " solicitó acceso con el token: " + saved.getToken(),
                    "INFO"
            );
        });

        // Send email
        emailService.sendOperatorInvitationEmail(email, saved.getToken());

        return saved;
    }

    @Transactional
    public User registerOperator(String email, String password, String setupKey) {
        String cleanKey = setupKey != null ? setupKey.trim().toUpperCase() : "";
        // Find if setupKey exists in our database
        OperatorKey opKey = operatorKeyRepository.findBySecretKey(cleanKey)
                .orElseThrow(() -> new IllegalArgumentException("Clave secreta inválida. Contactá al administrador de NorthPay."));

        if (opKey.getUsed()) {
            throw new IllegalArgumentException("La clave secreta ingresada ya ha sido utilizada.");
        }

        if (email == null || email.isBlank() || password == null || password.length() < 6) {
            throw new IllegalArgumentException("Correo y contraseña (mínimo 6 caracteres) son obligatorios.");
        }
        if (userRepository.findByEmail(email.toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un operador registrado con ese correo electrónico.");
        }

        // Consume secret key
        opKey.setUsed(true);
        opKey.setUsedByEmail(email.toLowerCase());
        opKey.setUsedAt(LocalDateTime.now());
        operatorKeyRepository.save(opKey);

        User operator = User.builder()
                .email(email.toLowerCase())
                .password(password)
                .role(Role.OPERATOR)
                .build();
        User saved = userRepository.save(operator);
        log.info("Operator registered successfully: {}", email);
        return saved;
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return user;
    }

    public List<OperatorKey> getAllOperatorKeys() {
        return operatorKeyRepository.findAll();
    }

    public Optional<Invitation> getInvitationByToken(String token) {
        return invitationRepository.findByToken(token);
    }

    public List<User> getAllOperators() {
        return userRepository.findByRole(Role.OPERATOR);
    }
}
