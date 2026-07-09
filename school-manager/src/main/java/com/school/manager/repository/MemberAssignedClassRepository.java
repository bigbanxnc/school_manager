package com.school.manager.repository;

import com.school.manager.entity.MemberAssignedClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberAssignedClassRepository extends JpaRepository<MemberAssignedClass, MemberAssignedClass.IdClass> {
}
