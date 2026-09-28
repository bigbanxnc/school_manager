package com.school.manager.mapper;

import com.school.manager.dto.GradeDto;
import com.school.manager.dto.StudentGradeResponseDto;
import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GradeMapper {

    @Mapping(target = "id", source = "student.id")
    @Mapping(target = "code", source = "student.code")
    @Mapping(target = "name", source = "student.name")
    @Mapping(target = "email", source = "student.email")
    @Mapping(target = "className", source = "student.className", defaultValue = "Chưa xếp lớp")
    @Mapping(target = "role", source = "student.role")
    @Mapping(target = "math", source = "grade.math")
    @Mapping(target = "math_oral", source = "grade.math_oral")
    @Mapping(target = "math_m15", source = "grade.math_m15")
    @Mapping(target = "math_mid", source = "grade.math_mid")
    @Mapping(target = "math_final", source = "grade.math_final")
    @Mapping(target = "literature", source = "grade.literature")
    @Mapping(target = "literature_oral", source = "grade.literature_oral")
    @Mapping(target = "literature_m15", source = "grade.literature_m15")
    @Mapping(target = "literature_mid", source = "grade.literature_mid")
    @Mapping(target = "literature_final", source = "grade.literature_final")
    @Mapping(target = "english", source = "grade.english")
    @Mapping(target = "english_oral", source = "grade.english_oral")
    @Mapping(target = "english_m15", source = "grade.english_m15")
    @Mapping(target = "english_mid", source = "grade.english_mid")
    @Mapping(target = "english_final", source = "grade.english_final")
    @Mapping(target = "gpa", source = "grade.gpa")
    StudentGradeResponseDto toStudentGradeResponseDto(Member student, Grade grade);

    @Mapping(target = "updatedBy", ignore = true)
    GradeDto toDto(Grade entity);

    Grade toEntity(GradeDto dto);
}

