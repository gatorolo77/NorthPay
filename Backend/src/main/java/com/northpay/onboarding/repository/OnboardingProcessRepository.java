package com.northpay.onboarding.repository;

import com.northpay.onboarding.model.OnboardingProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingProcessRepository extends JpaRepository<OnboardingProcess, Long> {
    Optional<OnboardingProcess> findByContractorUserId(Long contractorUserId);
}
