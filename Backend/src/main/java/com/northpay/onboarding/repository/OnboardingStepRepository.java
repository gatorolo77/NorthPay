package com.northpay.onboarding.repository;

import com.northpay.onboarding.model.OnboardingStep;
import com.northpay.onboarding.model.StepType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingStepRepository extends JpaRepository<OnboardingStep, Long> {
    List<OnboardingStep> findByProcessId(Long processId);
    Optional<OnboardingStep> findByProcessIdAndType(Long processId, StepType type);
}
