package com.northpay.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WhatsappWebhookDto {
    private String phone;
    private String message;
}
