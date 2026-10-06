package com.school.manager.mapper;

import com.school.manager.dto.GradeDto;
import com.school.manager.entity.Grade;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GradeMapper {

    @Mapping(target = "updatedBy", ignore = true)
    GradeDto toDto(Grade entity);

    Grade toEntity(GradeDto dto);
}

