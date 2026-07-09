package com.school.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDto {
    private String id;
    private String name;
    private String email;
    private String password;
    private String role;

    private String className;

    private String subject;
    private List<String> assignedClasses;
}
