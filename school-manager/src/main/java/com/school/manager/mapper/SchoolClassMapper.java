package com.school.manager.mapper;

import com.school.manager.dto.SchoolClassDto;
import com.school.manager.entity.SchoolClass;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SchoolClassMapper {

    @Mapping(target = "studentCount", ignore = true)
    @Mapping(target = "teacherCount", ignore = true)
    SchoolClassDto toDto(SchoolClass entity);

    SchoolClass toEntity(SchoolClassDto dto);
}

