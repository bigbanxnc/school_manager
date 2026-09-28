package com.school.manager.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "school_classes", indexes = {
        @Index(name = "idx_class_code", columnList = "code", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class SchoolClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    @JsonAlias({"id", "code"})
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @com.fasterxml.jackson.annotation.JsonSetter("id")
    public void deserializeId(Object val) {
        if (val instanceof Number num) {
            this.id = num.longValue();
        } else if (val instanceof String s) {
            try {
                this.id = Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                if (this.code == null || this.code.trim().isEmpty()) {
                    this.code = s.trim();
                }
            }
        }
    }
}
