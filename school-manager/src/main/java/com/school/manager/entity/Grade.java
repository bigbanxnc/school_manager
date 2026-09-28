package com.school.manager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

@Entity
@Table(name = "grades", indexes = {
        @Index(name = "idx_grade_student_id", columnList = "student_id", unique = true)
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

    @com.fasterxml.jackson.annotation.JsonSetter("id")
    public void deserializeId(Object val) {
        if (val instanceof Number num) {
            this.id = num.longValue();
        } else if (val instanceof String s && !s.trim().isEmpty()) {
            try {
                this.id = Long.parseLong(s.trim());
            } catch (NumberFormatException e) {
                if (this.studentCode == null || this.studentCode.trim().isEmpty()) {
                    this.studentCode = s.trim();
                }
            }
        }
    }

    @Column(name = "student_id", length = 50, nullable = false)
    private String studentId;

    @Column(name = "student_code", length = 50)
    private String studentCode;



    @com.fasterxml.jackson.annotation.JsonSetter("studentId")
    public void deserializeStudentId(Object val) {
        if (val != null) {
            String str = String.valueOf(val).trim();
            this.studentId = str;
            if (this.studentCode == null || this.studentCode.trim().isEmpty()) {
                this.studentCode = str;
            }
        }
    }

    public static class GradeBuilder {
        public GradeBuilder studentId(Long studentId) {
            this.studentId = studentId != null ? String.valueOf(studentId) : null;
            return this;
        }

        public GradeBuilder studentId(String studentId) {
            this.studentId = studentId;
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
        ).forEach(sub ->
                Optional.ofNullable(calculateSubjectAverage(sub.oral, sub.m15, sub.mid, sub.finalScore))
                        .ifPresent(sub.setter)
        );

        java.util.DoubleSummaryStatistics stats = java.util.stream.Stream.of(math, literature, english)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .summaryStatistics();
        this.gpa = stats.getCount() > 0 ? Math.round(stats.getAverage() * 100.0) / 100.0 : null;
    }

    private record SubjectConfig(
            Consumer<Double> setter,
            Double oral, Double m15, Double mid, Double finalScore
    ) {}

    private static class SubjectPair {
        @Getter
        public Double value;
        public Double rate;

        public SubjectPair(Double value, Double rate) {
            this.value = value;
            this.rate = rate;
        }
    }

    private Double calculateSubjectAverage(List<SubjectPair> SubjectPairList) {
        if (SubjectPairList == null || SubjectPairList.isEmpty()) {
            return null;
        }

        AtomicReference<Double> sum = new AtomicReference<>(0.0);
        AtomicReference<Double> totalWeight = new AtomicReference<>(0.0);

        SubjectPairList.stream().filter(s -> s != null && s.value != null)
                .forEach(s -> {
                    sum.updateAndGet(v -> v + s.value * s.rate);
                    totalWeight.updateAndGet(v -> v + s.rate);
                });

        return totalWeight.get() > 0
                ? Math.round((sum.get() / totalWeight.get()) * 100.0) / 100.0
                : null;
    }

    private Double calculateSubjectAverage(Double oral, Double m15, Double mid, Double finalScore) {
        return calculateSubjectAverage(List.of(
                new SubjectPair(oral, 1.0),
                new SubjectPair(m15, 1.0),
                new SubjectPair(mid, 2.0),
                new SubjectPair(finalScore, 3.0)
        ));
    }
}
