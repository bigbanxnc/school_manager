package com.school.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeDto {
    private String studentId;
    private Double math;
    private Double literature;
    private Double english;
}
