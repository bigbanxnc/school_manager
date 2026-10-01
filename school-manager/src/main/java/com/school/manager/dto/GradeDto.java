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
public class GradeDto {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("studentId")
    private String studentId;

    @JsonProperty("studentCode")
    private String studentCode;

    public void setStudentId(Long sid) {
        this.studentId = sid != null ? String.valueOf(sid) : null;
    }

    public void setStudentId(String sid) {
        this.studentId = sid;
    }

    public static class GradeDtoBuilder {
        public GradeDtoBuilder studentId(Long studentId) {
            this.studentId = studentId != null ? String.valueOf(studentId) : null;
            return this;
        }

        public GradeDtoBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }
    }

    private Double math;
    private Double literature;
    private Double english;

    private Double math_oral;
    private Double math_m15;
    private Double math_mid;
    private Double math_final;

    private Double literature_oral;
    private Double literature_m15;
    private Double literature_mid;
    private Double literature_final;

    private Double english_oral;
    private Double english_m15;
    private Double english_mid;
    private Double english_final;

    private Double gpa;

    private String updatedBy;

    public Double getGpa() {
        return this.gpa != null ? this.gpa : com.school.manager.util.ScoreUtil.calculateGpa(math, literature, english);
    }

    @JsonSetter("studentId")
    public void setStudentIdFromJson(Object val) {
        if (val != null) {
            String str = String.valueOf(val).trim();
            this.studentId = str;
            if (this.studentCode == null || this.studentCode.trim().isEmpty()) {
                this.studentCode = str;
            }
        }
    }
}
