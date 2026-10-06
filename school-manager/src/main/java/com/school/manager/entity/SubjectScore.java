package com.school.manager.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.school.manager.util.ScoreUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subject_scores", indexes = {
        @Index(name = "idx_subject_score_grade", columnList = "grade_id"),
        @Index(name = "idx_subject_score_unique", columnList = "grade_id, subject_name", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id", nullable = false)
    @JsonIgnore
    private Grade grade;

    @Column(name = "subject_name", length = 50, nullable = false)
    private String subjectName;

    @Column(name = "oral_score")
    private Double oralScore;

    @Column(name = "m15_score")
    private Double m15Score;

    @Column(name = "mid_score")
    private Double midScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "average_score")
    private Double averageScore;

    @PrePersist
    @PreUpdate
    public void calculateAverage() {
        this.averageScore = ScoreUtil.calculateAverage(oralScore, m15Score, midScore, finalScore);
    }
}
