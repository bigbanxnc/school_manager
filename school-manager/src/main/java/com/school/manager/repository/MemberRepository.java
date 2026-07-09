package com.school.manager.repository;

import com.school.manager.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, String> {


    @Query("SELECT m FROM Member m WHERE LOWER(m.email) = LOWER(:email)")
    Optional<Member> findByEmailIgnoreCase(@Param("email") String email);

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
}
