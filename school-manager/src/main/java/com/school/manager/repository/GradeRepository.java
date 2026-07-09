package com.school.manager.repository;

import com.school.manager.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, String> {

    @Query("SELECT g FROM Grade g WHERE g.math >= :minScore")
    List<Grade> findExcellentMathStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.literature >= :minScore")
    List<Grade> findExcellentLiteratureStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.english >= :minScore")
    List<Grade> findExcellentEnglishStudents(@Param("minScore") Double minScore);

    @Query("SELECT g FROM Grade g WHERE g.math IS NOT NULL AND g.literature IS NOT NULL AND g.english IS NOT NULL")
    List<Grade> findStudentsWithCompleteGrades();
}


