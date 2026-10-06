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

    Optional<Grade> findByStudentId(Long studentId);

    Optional<Grade> findByStudentCodeIgnoreCase(String studentCode);

    boolean existsByStudentId(Long studentId);

    boolean existsByStudentCodeIgnoreCase(String studentCode);

    @Modifying
    @Transactional
    @Query("DELETE FROM Grade g WHERE g.studentId = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT g FROM Grade g WHERE g.math >= :minScore")
    List<Grade> findExcellentMathStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.literature >= :minScore")
    List<Grade> findExcellentLiteratureStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.english >= :minScore")
    List<Grade> findExcellentEnglishStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.math IS NOT NULL AND g.literature IS NOT NULL AND g.english IS NOT NULL")
    List<Grade> findStudentsWithCompleteGrades();
}
