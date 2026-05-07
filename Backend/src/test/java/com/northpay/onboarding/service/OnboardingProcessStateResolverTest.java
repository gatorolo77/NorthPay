package com.northpay.onboarding.service;

import com.northpay.onboarding.dto.OnboardingSummaryDto;
import com.northpay.onboarding.dto.StepSummaryDto;
import com.northpay.onboarding.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OnboardingProcessStateResolverTest {

    private OnboardingProcessStateResolver stateResolver;
    private OnboardingProcess process;

    @BeforeEach
    void setUp() {
        stateResolver = new OnboardingProcessStateResolver();
        process = OnboardingProcess.builder()
                .id(1L)
                .contractorUserId(100L)
                .status(OnboardingStatus.CREATED)
                .currentStep(StepType.PERSONAL_DATA)
                .progress(0)
                .build();
    }

    @Test
    void testResolveInitialState() {
        List<OnboardingStep> steps = new ArrayList<>();
        for (StepType type : StepType.values()) {
            steps.add(OnboardingStep.builder()
                    .processId(1L)
                    .type(type)
                    .status(StepStatus.NOT_STARTED)
                    .build());
        }

        OnboardingSummaryDto summary = stateResolver.resolve(process, steps);

        assertEquals("CREATED", summary.getStatus());
        assertEquals("PERSONAL_DATA", summary.getCurrentStep());
        assertEquals(0, summary.getProgress());
        assertTrue(summary.getCanProceed());
        assertTrue(summary.getBlockingIssues().isEmpty());
    }

    @Test
    void testResolvePersonalDataCompleted() {
        List<OnboardingStep> steps = new ArrayList<>();
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.PERSONAL_DATA).status(StepStatus.COMPLETED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.DOCUMENT_UPLOAD).status(StepStatus.IN_PROGRESS).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.CONTRACT_SIGN).status(StepStatus.NOT_STARTED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.PAYMENT_METHOD).status(StepStatus.NOT_STARTED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.IDENTITY_VERIFICATION).status(StepStatus.NOT_STARTED).build());

        OnboardingSummaryDto summary = stateResolver.resolve(process, steps);

        assertEquals("IN_PROGRESS", summary.getStatus());
        assertEquals("DOCUMENT_UPLOAD", summary.getCurrentStep());
        assertEquals(20, summary.getProgress());
        assertTrue(summary.getCanProceed());
        assertFalse(summary.getBlockingIssues().isEmpty()); // because document upload has no documents approved yet
    }

    @Test
    void testResolveDocumentUnderReview() {
        List<OnboardingStep> steps = new ArrayList<>();
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.PERSONAL_DATA).status(StepStatus.COMPLETED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.DOCUMENT_UPLOAD).status(StepStatus.IN_REVIEW).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.CONTRACT_SIGN).status(StepStatus.NOT_STARTED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.PAYMENT_METHOD).status(StepStatus.NOT_STARTED).build());
        steps.add(OnboardingStep.builder().processId(1L).type(StepType.IDENTITY_VERIFICATION).status(StepStatus.NOT_STARTED).build());

        OnboardingSummaryDto summary = stateResolver.resolve(process, steps);

        assertEquals("IN_PROGRESS", summary.getStatus());
        assertEquals("DOCUMENT_UPLOAD", summary.getCurrentStep());
        assertEquals(20, summary.getProgress());
        assertFalse(summary.getCanProceed()); // Cannot proceed while under review
        assertTrue(summary.getBlockingIssues().contains("Uploaded documents are under review by the operations team."));
    }

    @Test
    void testResolveAllStepsCompleted() {
        List<OnboardingStep> steps = new ArrayList<>();
        for (StepType type : StepType.values()) {
            steps.add(OnboardingStep.builder()
                    .processId(1L)
                    .type(type)
                    .status(StepStatus.COMPLETED)
                    .build());
        }

        OnboardingSummaryDto summary = stateResolver.resolve(process, steps);

        assertEquals("COMPLETED", summary.getStatus());
        assertNull(summary.getCurrentStep());
        assertEquals(100, summary.getProgress());
        assertFalse(summary.getCanProceed());
        assertTrue(summary.getBlockingIssues().isEmpty());
    }
}
