package com.school.manager.repository;

import com.school.manager.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long>, JpaSpecificationExecutor<Grade> {

    Optional<Grade> findByStudentId(String studentId);

    Optional<Grade> findByStudentCode(String studentCode);

    @Query("SELECT g FROM Grade g WHERE g.studentId = :idOrCode OR g.studentCode = :idOrCode")
    Optional<Grade> findByStudentIdOrCode(@Param("idOrCode") String idOrCode);

    boolean existsByStudentId(String studentId);

    boolean existsByStudentCode(String studentCode);

    @Modifying
    @Transactional
    @Query("DELETE FROM Grade g WHERE g.studentId = :idOrCode OR g.studentCode = :idOrCode")
    void deleteByStudentIdOrCode(@Param("idOrCode") String idOrCode);

    default Optional<Grade> findByStudentId(Long studentId) {
        return studentId == null ? Optional.empty() : findByStudentIdOrCode(String.valueOf(studentId));
    }

    default boolean existsByStudentId(Long studentId) {
        return studentId != null && (existsByStudentId(String.valueOf(studentId)) || existsByStudentCode(String.valueOf(studentId)));
    }

    default void deleteByStudentId(Long studentId) {
        if (studentId != null) {
            deleteByStudentIdOrCode(String.valueOf(studentId));
        }
    }

    default void deleteByStudentId(String studentId) {
        if (studentId != null) {
            deleteByStudentIdOrCode(studentId);
        }
    }

    @Query("SELECT g FROM Grade g WHERE g.math >= :minScore")
    List<Grade> findExcellentMathStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.literature >= :minScore")
    List<Grade> findExcellentLiteratureStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.english >= :minScore")
    List<Grade> findExcellentEnglishStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.math IS NOT NULL AND g.literature IS NOT NULL AND g.english IS NOT NULL")
    List<Grade> findStudentsWithCompleteGrades();
}


