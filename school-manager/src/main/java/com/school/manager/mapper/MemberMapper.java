package com.school.manager.mapper;

import com.school.manager.dto.MemberDto;
import com.school.manager.entity.Member;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface MemberMapper {

    @Mapping(target = "assignedClasses", source = "assignedClasses", qualifiedByName = "mapAssignedClasses")
    MemberDto toDto(Member entity);

    @Mapping(target = "assignedClasses", source = "assignedClasses", qualifiedByName = "mapAssignedClasses")
    Member toEntity(MemberDto dto);

    @Named("mapAssignedClasses")
    @SuppressWarnings("unused")
    default List<String> mapAssignedClasses(List<String> list) {
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }
}


