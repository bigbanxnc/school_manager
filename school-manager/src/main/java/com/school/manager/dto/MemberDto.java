package com.school.manager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDto {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("code")
    private String code;

    @NotBlank(message = "Tên không được để trống")
    private String name;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String password;
    private String role;

    @JsonProperty("mustChangePassword")
    private Boolean mustChangePassword;

    private String className;

    private String subject;

    @Builder.Default
    private List<String> assignedClasses = new ArrayList<>();

    public List<String> getAssignedClasses() {
        return assignedClasses != null ? assignedClasses : new ArrayList<>();
    }
}
