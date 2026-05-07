package com.northpay.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentMethodDto {
    private String provider;
    private Map<String, Object> data;
}
