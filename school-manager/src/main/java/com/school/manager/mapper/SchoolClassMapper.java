package com.school.manager.mapper;

import com.school.manager.dto.SchoolClassDto;
import com.school.manager.entity.SchoolClass;
import org.springframework.stereotype.Component;

@Component
public class SchoolClassMapper {

    public SchoolClassDto toDto(SchoolClass entity) {
        if (entity == null) return null;

        return SchoolClassDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .build();
    }

    public SchoolClass toEntity(SchoolClassDto dto) {
        if (dto == null) return null;

        return SchoolClass.builder()
                .id(dto.getId())
                .name(dto.getName())
                .build();
    }
}
