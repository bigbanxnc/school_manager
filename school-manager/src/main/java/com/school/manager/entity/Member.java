package com.school.manager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

import java.util.List;

@Entity
@Table(name = "members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member implements Persistable<String> {
    @Id
    @Column(length = 50)
    private String id;
    private String name;
    private String email;
    private String password;
    private String role;


    @Column(name = "class_name", length = 50)
    private String className;
    private String subject;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "member_assigned_classes",
            joinColumns = @JoinColumn(name = "member_id", columnDefinition = "VARCHAR(50)")
    )
    @Column(name = "class_id", columnDefinition = "VARCHAR(50)")
    private List<String> assignedClasses;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostPersist
    @PostLoad
    public void markNotNew() {
        this.isNew = false;
    }
}
