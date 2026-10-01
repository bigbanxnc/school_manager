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

    @Query("SELECT g FROM Grade g WHERE LOWER(g.studentCode) = LOWER(:code) OR LOWER(g.studentId) = LOWER(:code)")
    Optional<Grade> findByStudentCodeIgnoreCase(@Param("code") String code);

    @Query("SELECT g FROM Grade g WHERE g.studentId = :studentId OR LOWER(g.studentCode) = LOWER(:studentId)")
    Optional<Grade> findByStudentIdStr(@Param("studentId") String studentId);

    @Query("SELECT COUNT(g) > 0 FROM Grade g WHERE LOWER(g.studentCode) = LOWER(:code) OR LOWER(g.studentId) = LOWER(:code)")
    boolean existsByStudentCodeIgnoreCase(@Param("code") String code);

    @Query("SELECT COUNT(g) > 0 FROM Grade g WHERE g.studentId = :studentId OR LOWER(g.studentCode) = LOWER(:studentId)")
    boolean existsByStudentIdStr(@Param("studentId") String studentId);

    default Optional<Grade> findByStudentIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.trim().isEmpty()) {
            return Optional.empty();
        }
        String trimmed = idOrCode.trim();
        Optional<Grade> byCode = findByStudentCodeIgnoreCase(trimmed);
        if (byCode.isPresent()) {
            return byCode;
        }
        try {
            Long.parseLong(trimmed);
            return findByStudentIdStr(trimmed);
        } catch (NumberFormatException ignored) {
            return Optional.empty();
        }
    }

    default Optional<Grade> findByStudentId(Long studentId) {
        return studentId == null ? Optional.empty() : findByStudentIdStr(String.valueOf(studentId));
    }

    @SuppressWarnings("BooleanMethodIsAlwaysInverted")
    default boolean existsByStudentId(Long studentId) {
        return studentId != null && existsByStudentIdStr(String.valueOf(studentId));
    }

    @Modifying
    @Transactional
    @Query("DELETE FROM Grade g WHERE LOWER(g.studentCode) = LOWER(:code)")
    void deleteByStudentCode(@Param("code") String code);

    @Modifying
    @Transactional
    @Query("DELETE FROM Grade g WHERE g.studentId = :studentId")
    void deleteByStudentIdStr(@Param("studentId") String studentId);

    default void deleteByStudentIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.trim().isEmpty()) {
            return;
        }
        String trimmed = idOrCode.trim();
        deleteByStudentCode(trimmed);
        try {
            Long.parseLong(trimmed);
            deleteByStudentIdStr(trimmed);
        } catch (NumberFormatException ignored) {}
    }

    default void deleteByStudentId(Long studentId) {
        if (studentId != null) {
            deleteByStudentIdOrCode(String.valueOf(studentId));
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


