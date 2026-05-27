package com.northpay.onboarding.controller;

import com.northpay.onboarding.model.Invitation;
import com.northpay.onboarding.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvitationController {

    private final AuthService authService;

    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(@RequestBody InvitationRequest request) {
        try {
            Invitation invitation = authService.createInvitation(request.getEmail(), request.getOperatorId());
            return ResponseEntity.ok(invitation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> getInvitationByToken(@PathVariable String token) {
        try {
            return authService.getInvitationByToken(token)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class InvitationRequest {
        private String email;
        private Long operatorId;
    }
}
