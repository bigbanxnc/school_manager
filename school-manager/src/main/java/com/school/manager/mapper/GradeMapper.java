package com.school.manager.mapper;

import com.school.manager.dto.GradeDto;
import com.school.manager.entity.Grade;
import org.springframework.stereotype.Component;

@Component
public class GradeMapper {

    public GradeDto toDto(Grade entity) {
        if (entity == null) return null;

        return GradeDto.builder()
                .studentId(entity.getStudentId())
                .math(entity.getMath())
                .literature(entity.getLiterature())
                .english(entity.getEnglish())
                .build();
    }

    public Grade toEntity(GradeDto dto) {
        if (dto == null) return null;

        return Grade.builder()
                .studentId(dto.getStudentId())
                .math(dto.getMath())
                .literature(dto.getLiterature())
                .english(dto.getEnglish())
                .build();
    }
}
