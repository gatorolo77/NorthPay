package com.northpay.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalDataDto {
    private String firstName;
    private String lastName;
    private String phone;
    private String country;
}
