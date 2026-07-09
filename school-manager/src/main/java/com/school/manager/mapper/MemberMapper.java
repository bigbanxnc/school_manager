package com.school.manager.mapper;

import com.school.manager.dto.MemberDto;
import com.school.manager.entity.Member;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class MemberMapper {

    public MemberDto toDto(Member entity) {
        if (entity == null) return null;

        return MemberDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .password(entity.getPassword())
                .role(entity.getRole())
                .className(entity.getClassName())
                .subject(entity.getSubject())
                .assignedClasses(entity.getAssignedClasses() != null ? new ArrayList<>(entity.getAssignedClasses()) : new ArrayList<>())
                .build();
    }

    public Member toEntity(MemberDto dto) {
        if (dto == null) return null;

        return Member.builder()
                .id(dto.getId())
                .name(dto.getName())
                .email(dto.getEmail())
                .password(dto.getPassword())
                .role(dto.getRole())
                .className(dto.getClassName())
                .subject(dto.getSubject())
                .assignedClasses(dto.getAssignedClasses() != null ? new ArrayList<>(dto.getAssignedClasses()) : new ArrayList<>())
                .build();
    }
}
