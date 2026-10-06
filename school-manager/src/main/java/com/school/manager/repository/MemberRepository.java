package com.school.manager.repository;

import com.school.manager.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {

    @Override
    @org.springframework.lang.NonNull
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"assignedClasses"})
    org.springframework.data.domain.Page<Member> findAll(
            @org.springframework.lang.Nullable org.springframework.data.jpa.domain.Specification<Member> spec,
            @org.springframework.lang.NonNull org.springframework.data.domain.Pageable pageable);

    Optional<Member> findByCode(String code);

    @Query("SELECT m FROM Member m WHERE LOWER(m.email) = LOWER(:email)")
    Optional<Member> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT m FROM Member m WHERE LOWER(m.code) = LOWER(:code)")
    Optional<Member> findByCodeIgnoreCase(@Param("code") String code);

    default Optional<Member> findByIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.trim().isEmpty()) {
            return Optional.empty();
        }
        String trimmed = idOrCode.trim();
        try {
            long numericId = Long.parseLong(trimmed);
            Optional<Member> byId = findById(numericId);
            if (byId.isPresent()) {
                return byId;
            }
        } catch (NumberFormatException ignored) {}
        return findByCodeIgnoreCase(trimmed);
    }

    @Query("SELECT m.className, COUNT(m) FROM Member m WHERE m.role = 'student' AND m.className IS NOT NULL GROUP BY m.className")
    List<Object[]> countStudentsPerClass();

    @Query("SELECT c, COUNT(DISTINCT m.id) FROM Member m JOIN m.assignedClasses c WHERE m.role = 'teacher' GROUP BY c")
    List<Object[]> countTeachersPerClass();

    @Query("SELECT m FROM Member m WHERE m.role = :role")
    List<Member> findByRole(@Param("role") String role);

    @Query("SELECT m FROM Member m WHERE m.role = :role AND m.className = :className")
    List<Member> findByRoleAndClassName(@Param("role") String role, @Param("className") String className);

    @Query("SELECT m FROM Member m WHERE m.role = :role AND m.subject = :subject")
    List<Member> findByRoleAndSubject(@Param("role") String role, @Param("subject") String subject);

    @Query("SELECT m FROM Member m JOIN m.assignedClasses c WHERE m.role = 'teacher' AND c = :classId")
    List<Member> findTeachersByClassId(@Param("classId") String classId);

    @Query("SELECT m FROM Member m WHERE LOWER(m.name) LIKE LOWER('%' || :keyword || '%')")
    List<Member> findByNameContainingIgnoreCase(@Param("keyword") String keyword);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Member m SET m.className = NULL WHERE m.className = :className")
    void clearClassNameForClass(@Param("className") String className);

}
