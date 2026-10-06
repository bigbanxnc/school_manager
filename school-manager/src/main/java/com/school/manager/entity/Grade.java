package com.school.manager.entity;

import com.school.manager.util.ScoreUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.function.Consumer;

@Entity
@Table(name = "grades", indexes = {
        @Index(name = "idx_grade_student_id", columnList = "student_id", unique = true),
        @Index(name = "idx_grade_student_code", columnList = "student_code")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class Grade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_code", length = 50)
    private String studentCode;

    @OneToMany(mappedBy = "grade", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubjectScore> subjectScores = new java.util.ArrayList<>();

    public static class GradeBuilder {
        public GradeBuilder studentId(Long studentId) {
            this.studentId = studentId;
            return this;
        }

        public GradeBuilder studentId(String studentId) {
            if (studentId != null && !studentId.trim().isEmpty()) {
                try {
                    this.studentId = Long.parseLong(studentId.trim());
                } catch (NumberFormatException ignored) {}
            }
            return this;
        }
    }

    private Double math;
    private Double literature;
    private Double english;

    @Column(name = "math_oral")
    private Double math_oral;

    @Column(name = "math_m15")
    private Double math_m15;

    @Column(name = "math_mid")
    private Double math_mid;

    @Column(name = "math_final")
    private Double math_final;

    @Column(name = "literature_oral")
    private Double literature_oral;

    @Column(name = "literature_m15")
    private Double literature_m15;

    @Column(name = "literature_mid")
    private Double literature_mid;

    @Column(name = "literature_final")
    private Double literature_final;

    @Column(name = "english_oral")
    private Double english_oral;

    @Column(name = "english_m15")
    private Double english_m15;

    @Column(name = "english_mid")
    private Double english_mid;

    @Column(name = "english_final")
    private Double english_final;

    private Double gpa;

    @PrePersist
    @PreUpdate
    public void calculateDerivedScores() {
        List.of(
                new SubjectConfig(v -> this.math = v, math_oral, math_m15, math_mid, math_final),
                new SubjectConfig(v -> this.literature = v, literature_oral, literature_m15, literature_mid, literature_final),
                new SubjectConfig(v -> this.english = v, english_oral, english_m15, english_mid, english_final)
        ).forEach(sub -> sub.setter.accept(ScoreUtil.calculateAverage(sub.oral, sub.m15, sub.mid, sub.finalScore)));

        this.gpa = ScoreUtil.calculateGpa(math, literature, english);
    }

    private record SubjectConfig(
            Consumer<Double> setter,
            Double oral, Double m15, Double mid, Double finalScore
    ) {}
}
