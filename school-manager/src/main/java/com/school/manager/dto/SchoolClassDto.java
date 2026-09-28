package com.school.manager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClassDto {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("code")
    private String code;

    private String name;
    private Integer studentCount;
    private Integer teacherCount;

    public SchoolClassDto(String code, String name) {
        this.code = code;
        this.name = name;
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
