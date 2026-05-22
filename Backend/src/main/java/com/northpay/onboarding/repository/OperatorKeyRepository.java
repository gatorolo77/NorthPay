package com.northpay.onboarding.repository;

import com.northpay.onboarding.model.OperatorKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OperatorKeyRepository extends JpaRepository<OperatorKey, Long> {
    Optional<OperatorKey> findBySecretKey(String secretKey);
}
