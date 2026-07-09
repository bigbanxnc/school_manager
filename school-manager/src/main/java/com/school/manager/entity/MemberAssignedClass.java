package com.school.manager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "member_assigned_classes")
@IdClass(MemberAssignedClass.IdClass.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberAssignedClass {

    @Id
    @Column(name = "member_id", length = 50)
    private String memberId;

    @Id
    @Column(name = "class_id", length = 50)
    private String classId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdClass implements Serializable {
        private String memberId;
        private String classId;
    }
}
