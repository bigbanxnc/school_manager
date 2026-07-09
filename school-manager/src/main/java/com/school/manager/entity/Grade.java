package com.school.manager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade implements Persistable<String> {
    @Id
    @Column(name = "student_id", length = 50)
    private String studentId;

    private Double math;
    private Double literature;
    private Double english;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public String getId() {
        return studentId;
    }

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
