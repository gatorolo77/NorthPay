package com.northpay.onboarding.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operator_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatorKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "secret_key", nullable = false, unique = true)
    private String secretKey;

    @Column(nullable = false)
    private Boolean used;

    @Column(name = "used_by_email")
    private String usedByEmail;

    @Column(name = "used_at")
    private LocalDateTime usedAt;
}
