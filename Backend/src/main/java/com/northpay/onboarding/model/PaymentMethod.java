package com.northpay.onboarding.model;

import com.northpay.onboarding.model.converter.JsonAttributeConverter;
import jakarta.persistence.*;
import lombok.*;
import java.util.Map;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "process_id", nullable = false, unique = true)
    private Long processId;

    @Column(nullable = false)
    private String provider;

    @Convert(converter = JsonAttributeConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Object> data;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
}
