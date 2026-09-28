package com.school.manager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
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

    private String name;
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

    @JsonSetter("id")
    public void setIdFromJson(Object val) {
        if (val instanceof Number num) {
            this.id = num.longValue();
        } else if (val instanceof String s && !s.trim().isEmpty()) {
            try {
                this.id = Long.parseLong(s.trim());
            } catch (NumberFormatException e) {
                if (this.code == null || this.code.trim().isEmpty()) {
                    this.code = s.trim();
                }
            }
        }
    }
}
