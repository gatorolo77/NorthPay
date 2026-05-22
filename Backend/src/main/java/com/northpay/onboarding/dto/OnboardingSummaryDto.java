package com.northpay.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OnboardingSummaryDto {
    private String status;
    private String currentStep;
    private Integer progress;
    private List<StepSummaryDto> steps;
    private Boolean canProceed;
    private List<String> blockingIssues;
    private String whatsappVerificationCode;
}
