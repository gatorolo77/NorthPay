package com.northpay.onboarding.service;

import com.northpay.onboarding.dto.OnboardingSummaryDto;
import com.northpay.onboarding.dto.StepSummaryDto;
import com.northpay.onboarding.model.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class OnboardingProcessStateResolver {

    /**
     * Resolves the comprehensive onboarding state including progress percentage, current active step,
     * progression allowances, and any active blocking issues.
     *
     * @param process the OnboardingProcess entity
     * @param steps   the list of OnboardingStep entities associated with the process
     * @return OnboardingSummaryDto representation of real-time state
     */
    public OnboardingSummaryDto resolve(OnboardingProcess process, List<OnboardingStep> steps) {
        Map<StepType, OnboardingStep> stepsMap = new EnumMap<>(StepType.class);
        if (steps != null) {
            for (OnboardingStep step : steps) {
                stepsMap.put(step.getType(), step);
            }
        }

        int progress = 0;
        StepType currentStep = null;
        boolean canProceed = true;
        List<String> blockingIssues = new ArrayList<>();
        List<StepSummaryDto> stepsSummaryList = new ArrayList<>();

        // Evaluate step completion
        boolean step0Comp = isStepCompleted(stepsMap.get(StepType.WHATSAPP_VERIFY));
        boolean step1Comp = isStepCompleted(stepsMap.get(StepType.PERSONAL_DATA));
        boolean step2Comp = isStepCompleted(stepsMap.get(StepType.DOCUMENT_UPLOAD));
        boolean step3Comp = isStepCompleted(stepsMap.get(StepType.CONTRACT_SIGN));
        boolean step4Comp = isStepCompleted(stepsMap.get(StepType.PAYMENT_METHOD));
        boolean step5Comp = isStepCompleted(stepsMap.get(StepType.IDENTITY_VERIFICATION));

        // Progress increments
        if (step0Comp) progress += 16;
        if (step1Comp) progress += 16;
        if (step2Comp) progress += 17;
        if (step3Comp) progress += 17;
        if (step4Comp) progress += 17;
        if (step5Comp) progress += 17;

        // Resolve current step context and blockages
        if (!step0Comp) {
            currentStep = StepType.WHATSAPP_VERIFY;
            OnboardingStep step = stepsMap.get(StepType.WHATSAPP_VERIFY);
            if (step != null && step.getStatus() == StepStatus.REJECTED) {
                blockingIssues.add("WhatsApp verification failed. Please request a new code.");
            }
        } else if (!step1Comp) {
            currentStep = StepType.PERSONAL_DATA;
            OnboardingStep step = stepsMap.get(StepType.PERSONAL_DATA);
            if (step != null && step.getStatus() == StepStatus.REJECTED) {
                blockingIssues.add("Personal data was rejected by the operations team. Please update your profile.");
            }
        } else if (!step2Comp) {
            currentStep = StepType.DOCUMENT_UPLOAD;
            OnboardingStep step = stepsMap.get(StepType.DOCUMENT_UPLOAD);
            if (step != null) {
                if (step.getStatus() == StepStatus.IN_REVIEW) {
                    canProceed = false;
                    blockingIssues.add("Uploaded documents are under review by the operations team.");
                } else if (step.getStatus() == StepStatus.REJECTED) {
                    blockingIssues.add("Some documents were rejected. Please re-upload corrected versions.");
                }
            } else {
                blockingIssues.add("Please upload the required identification documents.");
            }
        } else if (!step3Comp) {
            currentStep = StepType.CONTRACT_SIGN;
            OnboardingStep step = stepsMap.get(StepType.CONTRACT_SIGN);
            if (step != null && step.getStatus() == StepStatus.REJECTED) {
                blockingIssues.add("Signed contract was rejected. Please sign again.");
            } else {
                blockingIssues.add("Contract signing is pending.");
            }
        } else if (!step4Comp) {
            currentStep = StepType.PAYMENT_METHOD;
            OnboardingStep step = stepsMap.get(StepType.PAYMENT_METHOD);
            if (step != null && step.getStatus() == StepStatus.REJECTED) {
                blockingIssues.add("Payment method was rejected. Please update details.");
            } else {
                blockingIssues.add("Payment method configuration is pending.");
            }
        } else if (!step5Comp) {
            currentStep = StepType.IDENTITY_VERIFICATION;
            OnboardingStep step = stepsMap.get(StepType.IDENTITY_VERIFICATION);
            if (step != null) {
                if (step.getStatus() == StepStatus.IN_REVIEW) {
                    canProceed = false;
                    blockingIssues.add("Identity verification is currently in progress.");
                } else if (step.getStatus() == StepStatus.REJECTED) {
                    blockingIssues.add("Identity verification failed. Please try again.");
                }
            } else {
                blockingIssues.add("Identity verification is pending.");
            }
        }

        // Fill steps array matching requested JSON schema
        for (StepType type : StepType.values()) {
            OnboardingStep step = stepsMap.get(type);
            String statusStr = (step != null) ? step.getStatus().name() : StepStatus.NOT_STARTED.name();
            stepsSummaryList.add(new StepSummaryDto(type.name(), statusStr));
        }

        // Determine process status
        OnboardingStatus resolvedStatus = OnboardingStatus.IN_PROGRESS;
        if (progress == 0) {
            resolvedStatus = OnboardingStatus.CREATED;
        } else if (progress == 100) {
            resolvedStatus = OnboardingStatus.COMPLETED;
        } else if (currentStep == StepType.IDENTITY_VERIFICATION) {
            resolvedStatus = OnboardingStatus.PENDING_VERIFICATION;
        }

        OnboardingStep whatsappStep = stepsMap.get(StepType.WHATSAPP_VERIFY);
        String whatsappCode = null;
        if (whatsappStep != null && whatsappStep.getData() != null) {
            whatsappCode = (String) whatsappStep.getData().get("sentCode");
        }

        return OnboardingSummaryDto.builder()
                .status(resolvedStatus.name())
                .currentStep(currentStep != null ? currentStep.name() : null)
                .progress(progress)
                .steps(stepsSummaryList)
                .canProceed(canProceed)
                .blockingIssues(blockingIssues)
                .whatsappVerificationCode(whatsappCode)
                .build();
    }

    private boolean isStepCompleted(OnboardingStep step) {
        return step != null && step.getStatus() == StepStatus.COMPLETED;
    }
}
