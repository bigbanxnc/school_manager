package com.school.manager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "school_classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClass implements Persistable<String> {
    @Id
    @Column(length = 50)
    private String id;
    private String name;

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
