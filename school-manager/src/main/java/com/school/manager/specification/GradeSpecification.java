package com.school.manager.specification;

import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GradeSpecification {

    private static final List<Map.Entry<String, String>> SUBJECT_PATTERNS = List.of(
            Map.entry("english oral", "englishoral"),
            Map.entry("english m15", "englishm15"),
            Map.entry("english mid", "englishmid"),
            Map.entry("english final", "englishfinal"),
            Map.entry("english", "english"),
            Map.entry("literature oral", "literatureoral"),
            Map.entry("literature m15", "literaturem15"),
            Map.entry("literature mid", "literaturemid"),
            Map.entry("literature final", "literaturefinal"),
            Map.entry("literature", "literature"),
            Map.entry("math oral", "mathoral"),
            Map.entry("math m15", "mathm15"),
            Map.entry("math mid", "mathmid"),
            Map.entry("math final", "mathfinal"),
            Map.entry("math", "math"),
            Map.entry("oral", "oral"),
            Map.entry("m15", "m15"),
            Map.entry("mid", "mid"),
            Map.entry("final", "final"),
            Map.entry("gpa", "gpa")
    );

    public static Specification<Grade> filterGrades(
            String scoreSubject,
            String scoreOp,
            Double scoreVal,
            String teacherSubject,
            String search,
            List<String> classes
    ) {
        return (Root<Grade> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (query == null) {
                return cb.conjunction();
            }

            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();

            Subquery<String> codeSubquery = query.subquery(String.class);
            Root<Member> member = codeSubquery.from(Member.class);
            codeSubquery.select(member.get("code"));
            codeSubquery.where(cb.and(buildMemberClassAndRolePredicates(cb, member, classes).toArray(new Predicate[0])));

            Subquery<String> idSubquery = query.subquery(String.class);
            Root<Member> memberId = idSubquery.from(Member.class);
            idSubquery.select(memberId.get("id").as(String.class));
            idSubquery.where(cb.and(buildMemberClassAndRolePredicates(cb, memberId, classes).toArray(new Predicate[0])));

            predicates.add(cb.or(
                    root.get("studentId").in(codeSubquery),
                    root.get("studentId").in(idSubquery),
                    root.get("studentCode").in(codeSubquery)
            ));

            if (scoreSubject != null && !"none".equalsIgnoreCase(scoreSubject) && scoreVal != null) {
                String targetField = resolveFieldName(scoreSubject, teacherSubject);
                Predicate p = buildScorePredicate(root, cb, targetField, scoreOp, scoreVal);
                if (p != null) predicates.add(p);
            }

            if (search != null && !search.trim().isEmpty()) {
                String rawSearch = search.trim();
                String rawLower = rawSearch.toLowerCase();
                String clean = rawSearch.replace(',', '.');

                String searchSubject = null;
                String remainingText = clean;

                for (Map.Entry<String, String> entry : SUBJECT_PATTERNS) {
                    if (rawLower.contains(entry.getKey())) {
                        searchSubject = entry.getValue();
                        remainingText = remainingText.replaceAll("(?i)" + Pattern.quote(entry.getKey()), "").trim();
                        break;
                    }
                }

                remainingText = remainingText.replaceAll("[:=]", " ").trim();

                Pattern pattern = Pattern.compile("^([<>]=?|=)?\\s*([0-9]+(?:\\.[0-9]+)?)$");
                Matcher matcher = pattern.matcher(remainingText);

                List<Predicate> searchPredicates = new ArrayList<>();

                if (matcher.matches()) {
                    String rawOp = matcher.group(1);
                    String numStr = matcher.group(2);
                    String op = (rawOp == null) ? "eq" : switch (rawOp.trim()) {
                        case ">" -> "gt";
                        case "<" -> "lt";
                        case ">=" -> "gte";
                        case "<=" -> "lte";
                        case "=" -> "exact_eq";
                        default -> "eq";
                    };

                    try {
                        double compVal = Double.parseDouble(numStr);
                        int decimalPlaces = 0;
                        if (numStr.contains(".")) {
                            decimalPlaces = numStr.length() - numStr.indexOf('.') - 1;
                        }
                        List<String> scoreFields = getRelevantScoreFields(searchSubject, teacherSubject);

                        for (String field : scoreFields) {
                            Predicate p = buildScoreSearchPredicate(root, cb, field, op, compVal, decimalPlaces);
                            if (p != null) searchPredicates.add(p);
                        }
                    } catch (NumberFormatException ignored) {}
                } else if (searchSubject != null && remainingText.isEmpty()) {
                    List<String> scoreFields = getRelevantScoreFields(searchSubject, teacherSubject);
                    for (String field : scoreFields) {
                        if (isValidGradeField(field)) {
                            searchPredicates.add(cb.isNotNull(root.get(field)));
                        }
                    }
                }

                Subquery<String> textCodeSubquery = query.subquery(String.class);
                Root<Member> textMemberCode = textCodeSubquery.from(Member.class);
                textCodeSubquery.select(textMemberCode.get("code"));
                textCodeSubquery.where(cb.or(buildSearchMemberPredicates(cb, textMemberCode, rawLower, remainingText, rawSearch, matcher).toArray(new Predicate[0])));

                Subquery<String> textIdSubquery = query.subquery(String.class);
                Root<Member> textMemberId = textIdSubquery.from(Member.class);
                textIdSubquery.select(textMemberId.get("id").as(String.class));
                textIdSubquery.where(cb.or(buildSearchMemberPredicates(cb, textMemberId, rawLower, remainingText, rawSearch, matcher).toArray(new Predicate[0])));

                searchPredicates.add(root.get("studentId").in(textCodeSubquery));
                searchPredicates.add(root.get("studentId").in(textIdSubquery));
                searchPredicates.add(root.get("studentCode").in(textCodeSubquery));
                searchPredicates.add(cb.like(cb.lower(root.get("studentId")), "%" + rawLower + "%"));
                searchPredicates.add(cb.like(cb.lower(root.get("studentCode")), "%" + rawLower + "%"));

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static final java.util.Set<String> VALID_GRADE_FIELDS = java.util.Set.of(
            "studentId", "math", "literature", "english", "gpa",
            "math_oral", "math_m15", "math_mid", "math_final",
            "literature_oral", "literature_m15", "literature_mid", "literature_final",
            "english_oral", "english_m15", "english_mid", "english_final"
    );

    private static boolean isValidGradeField(String fieldName) {
        return fieldName != null && VALID_GRADE_FIELDS.contains(fieldName);
    }

    private static String getTeacherSubjectOrDefault(String teacherSubject) {
        if (teacherSubject != null && !teacherSubject.trim().isEmpty()) {
            String ts = teacherSubject.toLowerCase();
            if (java.util.Set.of("math", "literature", "english").contains(ts)) {
                return ts;
            }
        }
        return "math";
    }

    private static String resolveFieldName(String scoreSubject, String teacherSubject) {
        String sub = scoreSubject.toLowerCase();
        String ts = getTeacherSubjectOrDefault(teacherSubject);
        return switch (sub) {
            case "subjectgpa" -> ts;
            case "oral" -> ts + "_oral";
            case "m15" -> ts + "_m15";
            case "mid" -> ts + "_mid";
            case "final" -> ts + "_final";
            default -> sub;
        };
    }

    private static List<String> getRelevantScoreFields(String searchSubject, String teacherSubject) {
        String validTs = null;
        if (teacherSubject != null && !teacherSubject.trim().isEmpty()) {
            String ts = teacherSubject.trim().toLowerCase();
            if (java.util.Set.of("math", "literature", "english").contains(ts)) {
                validTs = ts;
            }
        }

        if (validTs != null) {
            if (searchSubject == null || searchSubject.trim().isEmpty()) {
                return List.of(validTs, "gpa");
            }
            String ss = searchSubject.trim().toLowerCase();
            return switch (ss) {
                case "oral" -> List.of(validTs + "_oral");
                case "m15" -> List.of(validTs + "_m15");
                case "mid" -> List.of(validTs + "_mid");
                case "final" -> List.of(validTs + "_final");
                case "gpa" -> List.of("gpa");
                default -> {
                    if (ss.equals(validTs)) yield List.of(validTs);
                    if (ss.equals(validTs + "oral")) yield List.of(validTs + "_oral");
                    if (ss.equals(validTs + "m15")) yield List.of(validTs + "_m15");
                    if (ss.equals(validTs + "mid")) yield List.of(validTs + "_mid");
                    if (ss.equals(validTs + "final")) yield List.of(validTs + "_final");
                    yield List.of();
                }
            };
        }

        if (searchSubject == null || searchSubject.trim().isEmpty()) {
            return List.of("math", "literature", "english", "gpa");
        }

        String ss = searchSubject.trim().toLowerCase();
        return switch (ss) {
            case "math" -> List.of("math");
            case "mathoral" -> List.of("math_oral");
            case "mathm15" -> List.of("math_m15");
            case "mathmid" -> List.of("math_mid");
            case "mathfinal" -> List.of("math_final");
            case "literature" -> List.of("literature");
            case "literatureoral" -> List.of("literature_oral");
            case "literaturem15" -> List.of("literature_m15");
            case "literaturemid" -> List.of("literature_mid");
            case "literaturefinal" -> List.of("literature_final");
            case "english" -> List.of("english");
            case "englishoral" -> List.of("english_oral");
            case "englishm15" -> List.of("english_m15");
            case "englishmid" -> List.of("english_mid");
            case "englishfinal" -> List.of("english_final");
            case "oral" -> List.of("math_oral", "literature_oral", "english_oral");
            case "m15" -> List.of("math_m15", "literature_m15", "english_m15");
            case "mid" -> List.of("math_mid", "literature_mid", "english_mid");
            case "final" -> List.of("math_final", "literature_final", "english_final");
            case "gpa" -> List.of("gpa");
            default -> isValidGradeField(ss) ? List.of(ss) : List.of();
        };
    }

    private static Predicate buildScorePredicate(Root<Grade> root, CriteriaBuilder cb, String fieldName, String op, double val) {
        if (!isValidGradeField(fieldName)) {
            return null;
        }
        Path<Double> path = root.get(fieldName);
        String opStr = (op != null) ? op.toLowerCase() : "gte";
        return switch (opStr) {
            case "gt" -> cb.greaterThan(path, val);
            case "lt" -> cb.lessThan(path, val);
            case "lte" -> cb.lessThanOrEqualTo(path, val);
            case "eq" -> (val == Math.floor(val))
                    ? cb.and(cb.greaterThanOrEqualTo(path, val), cb.lessThan(path, val + 1.0))
                    : cb.and(cb.greaterThanOrEqualTo(path, val - 0.005), cb.lessThanOrEqualTo(path, val + 0.005));
            default -> cb.greaterThanOrEqualTo(path, val);
        };
    }

    private static Predicate buildScoreSearchPredicate(Root<Grade> root, CriteriaBuilder cb, String fieldName, String op, double val, int decimalPlaces) {
        if (op == null || !isValidGradeField(fieldName)) {
            return null;
        }
        Path<Double> path = root.get(fieldName);
        return switch (op) {
            case "gt" -> cb.greaterThan(path, val);
            case "lt" -> cb.lessThan(path, val);
            case "gte" -> cb.greaterThanOrEqualTo(path, val);
            case "lte" -> cb.lessThanOrEqualTo(path, val);
            case "exact_eq" -> cb.and(cb.greaterThanOrEqualTo(path, val - 0.005), cb.lessThanOrEqualTo(path, val + 0.005));
            case "eq" -> switch (decimalPlaces) {
                case 0 -> cb.and(cb.greaterThanOrEqualTo(path, val), cb.lessThan(path, val + 1.0));
                case 1 -> {
                    double upperLimit = Math.round((val + 0.1) * 100.0) / 100.0;
                    yield cb.and(cb.greaterThanOrEqualTo(path, val - 0.005), cb.lessThan(path, upperLimit));
                }
                default -> cb.and(cb.greaterThanOrEqualTo(path, val - 0.005), cb.lessThanOrEqualTo(path, val + 0.005));
            };
            default -> null;
        };
    }

    private static List<Predicate> buildMemberClassAndRolePredicates(CriteriaBuilder cb, Root<Member> member, List<String> classes) {
        List<Predicate> preds = new ArrayList<>();
        preds.add(cb.equal(cb.lower(member.get("role")), "student"));

        if (classes != null && !classes.isEmpty()) {
            boolean hasNullClass = classes.stream().anyMatch(c -> c == null || c.trim().isEmpty() || "unassigned".equalsIgnoreCase(c.trim()));
            List<String> validClasses = classes.stream()
                    .filter(c -> c != null && !c.trim().isEmpty() && !"unassigned".equalsIgnoreCase(c.trim()))
                    .map(String::trim)
                    .toList();

            if (!validClasses.isEmpty() && hasNullClass) {
                preds.add(cb.or(member.get("className").in(validClasses), cb.isNull(member.get("className"))));
            } else if (!validClasses.isEmpty()) {
                preds.add(member.get("className").in(validClasses));
            } else if (hasNullClass) {
                preds.add(cb.isNull(member.get("className")));
            }
        }
        return preds;
    }

    private static List<Predicate> buildSearchMemberPredicates(
            CriteriaBuilder cb,
            Root<Member> textMember,
            String rawLower,
            String remainingText,
            String rawSearch,
            Matcher matcher
    ) {
        String searchLower = "%" + rawLower + "%";
        String remLower = "%" + remainingText.toLowerCase() + "%";

        List<Predicate> mPreds = new ArrayList<>();
        mPreds.add(cb.like(cb.lower(textMember.get("name")), searchLower));
        mPreds.add(cb.like(cb.lower(textMember.get("code")), searchLower));
        mPreds.add(cb.like(textMember.get("id").as(String.class), searchLower));
        mPreds.add(cb.like(cb.lower(textMember.get("email")), searchLower));
        mPreds.add(cb.like(cb.lower(textMember.get("className")), searchLower));

        if (!matcher.matches() && !remainingText.isEmpty() && !remainingText.equalsIgnoreCase(rawSearch)) {
            mPreds.add(cb.like(cb.lower(textMember.get("name")), remLower));
            mPreds.add(cb.like(cb.lower(textMember.get("code")), remLower));
        }

        if ("student".contains(rawLower) || "hs".contains(rawLower)) {
            mPreds.add(cb.equal(cb.lower(textMember.get("role")), "student"));
        }
        if ("unassigned".contains(rawLower)) {
            mPreds.add(cb.isNull(textMember.get("className")));
        }

        return mPreds;
    }
}
