package com.school.manager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentGradeResponseDto {
    private Long id;
    private String code;
    private String name;
    private String email;
    private String className;
    private String role;

    private Double math;
    private Double math_oral;
    private Double math_m15;
    private Double math_mid;
    private Double math_final;

    private Double literature;
    private Double literature_oral;
    private Double literature_m15;
    private Double literature_mid;
    private Double literature_final;

    private Double english;
    private Double english_oral;
    private Double english_m15;
    private Double english_mid;
    private Double english_final;

    private Double gpa;

    public Double getGpa() {
        if (this.gpa != null) {
            return this.gpa;
        }
        java.util.DoubleSummaryStatistics stats = java.util.stream.Stream.of(math, literature, english)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .summaryStatistics();
        return stats.getCount() > 0 ? Math.round(stats.getAverage() * 100.0) / 100.0 : null;
    }
}
