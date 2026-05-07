package com.northpay.onboarding.controller;

import com.northpay.onboarding.dto.ReviewStepDto;
import com.northpay.onboarding.model.OnboardingProcess;
import com.northpay.onboarding.model.OnboardingStep;
import com.northpay.onboarding.service.OnboardingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operator")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OperatorController {

    private final OnboardingService onboardingService;

    @GetMapping("/processes")
    public ResponseEntity<List<OnboardingProcess>> getProcesses() {
        return ResponseEntity.ok(onboardingService.listAllProcesses());
    }

    @PostMapping("/steps/{stepId}/review")
    public ResponseEntity<?> reviewStep(
            @PathVariable("stepId") Long stepId,
            @RequestParam("operatorId") Long operatorId,
            @RequestBody ReviewStepDto dto) {
        try {
            OnboardingStep step = onboardingService.reviewStep(stepId, operatorId, dto);
            return ResponseEntity.ok(step);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/processes/{id}/assign")
    public ResponseEntity<?> assignOperator(
            @PathVariable("id") Long processId,
            @RequestBody AssignRequest request) {
        try {
            onboardingService.assignOperator(processId, request.getOperatorId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class AssignRequest {
        private Long operatorId;
    }
}
