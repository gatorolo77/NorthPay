package com.northpay.onboarding.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_processes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contractor_user_id", nullable = false, unique = true)
    private Long contractorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OnboardingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step", nullable = false)
    private StepType currentStep;

    @Column(nullable = false)
    private Integer progress;

    @Column(name = "assigned_operator_id")
    private Long assignedOperatorId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Transient
    private String contractorName;

    @Transient
    private String contractorEmail;

    @Transient
    private String contractorCountry;

    @Transient
    private String contractorPhone;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
