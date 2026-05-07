package com.northpay.onboarding.controller;

import com.northpay.onboarding.dto.*;
import com.northpay.onboarding.model.OnboardingProcess;
import com.northpay.onboarding.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/initiate")
    public ResponseEntity<OnboardingProcess> initiate(@RequestParam Long contractorUserId) {
        OnboardingProcess process = onboardingService.getOrCreateProcess(contractorUserId);
        return ResponseEntity.ok(process);
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<OnboardingSummaryDto> getSummary(@PathVariable("id") Long processId) {
        try {
            OnboardingSummaryDto summary = onboardingService.getOnboardingSummary(processId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/personal-data")
    public ResponseEntity<?> submitPersonalData(
            @PathVariable("id") Long processId,
            @RequestBody PersonalDataDto dto) {
        try {
            OnboardingSummaryDto summary = onboardingService.submitPersonalData(processId, dto);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @PathVariable("id") Long processId,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file) {
        try {
            OnboardingSummaryDto summary = onboardingService.uploadDocument(processId, type, file);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/contract/sign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> signContract(
            @PathVariable("id") Long processId,
            @RequestParam("file") MultipartFile file) {
        try {
            OnboardingSummaryDto summary = onboardingService.signContract(processId, file);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/payment-method")
    public ResponseEntity<?> configurePaymentMethod(
            @PathVariable("id") Long processId,
            @RequestBody PaymentMethodDto dto) {
        try {
            OnboardingSummaryDto summary = onboardingService.configurePaymentMethod(processId, dto);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/identity-verification")
    public ResponseEntity<?> completeIdentityVerification(
            @PathVariable("id") Long processId,
            @RequestParam("provider") String provider,
            @RequestParam(value = "success", defaultValue = "true") boolean success) {
        try {
            OnboardingSummaryDto summary = onboardingService.completeIdentityVerification(processId, provider, success);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
