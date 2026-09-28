package com.school.manager.repository;

import com.school.manager.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {

    Optional<SchoolClass> findByCode(String code);

    @Query("SELECT s FROM SchoolClass s WHERE LOWER(s.code) = LOWER(:code)")
    Optional<SchoolClass> findByCodeIgnoreCase(@Param("code") String code);

    boolean existsByCodeIgnoreCase(String code);

    default Optional<SchoolClass> findByIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.trim().isEmpty()) {
            return Optional.empty();
        }
        String trimmed = idOrCode.trim();
        try {
            long numericId = Long.parseLong(trimmed);
            Optional<SchoolClass> byId = findById(numericId);
            if (byId.isPresent()) {
                return byId;
            }
        } catch (NumberFormatException ignored) {}
        return findByCodeIgnoreCase(trimmed);
    }

    @Query("SELECT s FROM SchoolClass s WHERE LOWER(s.name) = LOWER(:name)")
    Optional<SchoolClass> findByNameIgnoreCase(@Param("name") String name);

    @Query("SELECT COUNT(s) > 0 FROM SchoolClass s WHERE LOWER(s.name) = LOWER(:name)")
    boolean existsByNameIgnoreCase(@Param("name") String name);
}
