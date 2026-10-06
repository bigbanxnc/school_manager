package com.school.manager.constant;

import lombok.Getter;

@Getter
@SuppressWarnings("unused")
public enum Role {
    STUDENT("student"),
    TEACHER("teacher"),
    ADMIN("admin");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public static boolean isValid(String role) {
        if (role == null) return false;
        for (Role r : values()) {
            if (r.value.equalsIgnoreCase(role.trim())) {
                return true;
            }
        }
        return false;
    }
}
