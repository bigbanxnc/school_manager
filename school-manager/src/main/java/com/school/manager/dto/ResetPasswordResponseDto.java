package com.school.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordResponseDto {
    private String userId;
    private String code;
    private String email;
    private String name;
    private String newPassword;
    private Boolean mustChangePassword;
    private String message;
}
