package com.school.manager.specification;

import com.school.manager.entity.Member;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class MemberSpecification {

    public static Specification<Member> filterMembers(
            String role,
            List<String> classes,
            boolean hasClasses,
            String currentUserId,
            String search,
            boolean hasSearch) {

        return (Root<Member> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();

            if (role != null && !role.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("role")), role.trim().toLowerCase()));
            }

            if (hasClasses && classes != null && !classes.isEmpty()) {
                Predicate classInPredicate = root.get("className").in(classes);
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    Predicate isCurrentTeacher = cb.and(
                            cb.equal(cb.lower(root.get("role")), "teacher"),
                            buildUserMatchPredicate(cb, root, currentUserId.trim())
                    );
                    predicates.add(cb.or(classInPredicate, isCurrentTeacher));
                } else {
                    predicates.add(classInPredicate);
                }
            }

            if (hasSearch && search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                String rawSearchLower = search.trim().toLowerCase();

                Join<Object, Object> assignedClassesJoin = root.join("assignedClasses", JoinType.LEFT);

                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(cb.like(cb.lower(root.get("name")), searchLower));
                searchPredicates.add(cb.like(cb.lower(root.get("code")), searchLower));
                searchPredicates.add(cb.like(root.get("id").as(String.class), searchLower));
                searchPredicates.add(cb.like(cb.lower(root.get("email")), searchLower));
                searchPredicates.add(cb.like(cb.lower(root.get("className")), searchLower));
                searchPredicates.add(cb.like(cb.lower(root.get("password")), searchLower));
                searchPredicates.add(cb.like(cb.lower(assignedClassesJoin.as(String.class)), searchLower));

                Stream.of("teacher", "student", "admin")
                        .filter(rawSearchLower::contains)
                        .forEach(r -> searchPredicates.add(cb.equal(cb.lower(root.get("role")), r)));
                if ("unassigned".contains(rawSearchLower) || "none".contains(rawSearchLower)) {
                    searchPredicates.add(cb.isNull(root.get("className")));
                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate buildUserMatchPredicate(CriteriaBuilder cb, Root<Member> root, String userId) {
        try {
            Long numericId = Long.parseLong(userId);
            return cb.or(cb.equal(root.get("id"), numericId), cb.equal(cb.lower(root.get("code")), userId.toLowerCase()));
        } catch (NumberFormatException ignored) {
            return cb.equal(cb.lower(root.get("code")), userId.toLowerCase());
        }
    }
}
