package com.northpay.onboarding.controller;

import com.northpay.onboarding.model.User;
import com.northpay.onboarding.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = authService.registerWithToken(request.getEmail(), request.getPassword(), request.getToken());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register-operator")
    public ResponseEntity<?> registerOperator(@RequestBody RegisterOperatorRequest request) {
        try {
            User user = authService.registerOperator(request.getEmail(), request.getPassword(), request.getSetupKey());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/invite-operator")
    public ResponseEntity<?> inviteOperator(@RequestBody InviteOperatorRequest request) {
        try {
            Invitation invitation = authService.createOperatorInvitation(request.getEmail());
            return ResponseEntity.ok(invitation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class RegisterRequest {
        private String email;
        private String password;
        private String token;
    }

    @Data
    public static class RegisterOperatorRequest {
        private String email;
        private String password;
        private String setupKey;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class InviteOperatorRequest {
        private String email;
    }
}
