package com.school.manager.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Entity
@Table(name = "members", indexes = {
        @Index(name = "idx_member_code", columnList = "code", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    @JsonAlias({"id", "code"})
    private String code;

    private String name;
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    private String role;

    @Column(name = "must_change_password", nullable = false)
    @Builder.Default
    private Boolean mustChangePassword = false;

    @Column(name = "class_name", length = 50)
    private String className;

    private String subject;

    @com.fasterxml.jackson.annotation.JsonSetter("id")
    public void deserializeId(Object val) {
        if (val instanceof Number num) {
            this.id = num.longValue();
        } else if (val instanceof String s && !s.trim().isEmpty()) {
            try {
                this.id = Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                if (this.code == null || this.code.trim().isEmpty()) {
                    this.code = s.trim();
                }
            }
        }
    }

    @ElementCollection
    @org.hibernate.annotations.BatchSize(size = 50)
    @CollectionTable(
            name = "member_assigned_classes",
            joinColumns = @JoinColumn(name = "member_id", referencedColumnName = "id")
    )
    @Column(name = "class_id", length = 50)
    @Builder.Default
    private List<String> assignedClasses = new java.util.ArrayList<>();

    public List<String> getAssignedClasses() {
        return assignedClasses != null ? assignedClasses : new java.util.ArrayList<>();
    }

    @PrePersist
    @PreUpdate
    public void ensureNonNullFields() {
        if (this.mustChangePassword == null) {
            this.mustChangePassword = false;
        }
        if (this.role == null || this.role.trim().isEmpty()) {
            this.role = "student";
        }
        String normalizedRole = this.role.trim().toLowerCase();
        if (this.code == null || this.code.trim().isEmpty()) {
            String prefix = switch (normalizedRole) {
                case "teacher" -> "GV";
                case "admin" -> "AD";
                default -> "HS";
            };
            this.code = prefix + (System.currentTimeMillis() % 100000);
        }
        if (this.email == null || this.email.trim().isEmpty()) {
            this.email = this.code.toLowerCase() + "@school.com";
        }
        if (this.password == null || this.password.trim().isEmpty()) {
            this.password = switch (normalizedRole) {
                case "admin" -> "admin123";
                case "teacher" -> "teacher123";
                default -> "hs123";
            };
        }
        this.password = com.school.manager.util.PasswordUtil.ensureSha1(this.password);

        if (this.name == null || this.name.trim().isEmpty()) {
            this.name = "Thành viên " + this.code;
        }
    }
}
