package com.school.manager.repository;

import com.school.manager.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, String> {

    @Query("SELECT s FROM SchoolClass s WHERE LOWER(s.name) = LOWER(:name)")
    Optional<SchoolClass> findByNameIgnoreCase(@Param("name") String name);

    @Query("SELECT COUNT(s) > 0 FROM SchoolClass s WHERE LOWER(s.name) = LOWER(:name)")
    boolean existsByNameIgnoreCase(@Param("name") String name);
}
