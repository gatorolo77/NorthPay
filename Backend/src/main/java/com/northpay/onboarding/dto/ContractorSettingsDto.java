package com.northpay.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractorSettingsDto {
    private String whatsappPhone;
    private String paymentProvider;
    private Map<String, Object> paymentData;
}
