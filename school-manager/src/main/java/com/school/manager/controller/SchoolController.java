package com.school.manager.controller;

import com.school.manager.dto.*;
import com.school.manager.service.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SchoolController {

    @Autowired
    private SchoolService schoolService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto credentials) {
        try {
            MemberDto loggedInUser = schoolService.login(credentials);
            return ResponseEntity.ok(loggedInUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/members")
    public ResponseEntity<?> getAllMembers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {

        List<MemberDto> list = schoolService.getAllMembers();

        if (role != null && !role.trim().isEmpty()) {
            list = list.stream()
                    .filter(m -> role.equalsIgnoreCase(m.getRole()))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(m -> (m.getId() != null && m.getId().toLowerCase().contains(q))
                            || (m.getName() != null && m.getName().toLowerCase().contains(q))
                            || (m.getEmail() != null && m.getEmail().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        if (page != null) {
            int p = page;
            int s = (size != null) ? size : 10;
            int totalElements = list.size();
            int totalPages = (int) Math.ceil((double) totalElements / s);
            if (totalPages == 0) totalPages = 1;

            int fromIndex = (p - 1) * s;
            int toIndex = Math.min(fromIndex + s, totalElements);

            List<MemberDto> content = new ArrayList<>();
            if (fromIndex >= 0 && fromIndex < totalElements) {
                content = list.subList(fromIndex, toIndex);
            }

            return ResponseEntity.ok(Map.of(
                    "content", content,
                    "totalElements", totalElements,
                    "totalPages", totalPages,
                    "page", p,
                    "size", s
            ));
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/teachers")
    public ResponseEntity<?> getAllTeachers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search) {

        List<MemberDto> list = schoolService.getAllMembers().stream()
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .collect(Collectors.toList());

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(m -> (m.getId() != null && m.getId().toLowerCase().contains(q))
                            || (m.getName() != null && m.getName().toLowerCase().contains(q))
                            || (m.getEmail() != null && m.getEmail().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        if (page != null) {
            int p = page;
            int s = (size != null) ? size : 10;
            int totalElements = list.size();
            int totalPages = (int) Math.ceil((double) totalElements / s);
            if (totalPages == 0) totalPages = 1;

            int fromIndex = (p - 1) * s;
            int toIndex = Math.min(fromIndex + s, totalElements);

            List<MemberDto> content = new ArrayList<>();
            if (fromIndex >= 0 && fromIndex < totalElements) {
                content = list.subList(fromIndex, toIndex);
            }

            return ResponseEntity.ok(Map.of(
                    "content", content,
                    "totalElements", totalElements,
                    "totalPages", totalPages,
                    "page", p,
                    "size", s
            ));
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping("/teachers")
    public ResponseEntity<MemberDto> createTeacher(@RequestBody MemberDto teacherDto) {
        return ResponseEntity.ok(schoolService.createTeacher(teacherDto));
    }

    @PutMapping("/teachers/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable String id, @RequestBody MemberDto teacherDto) {
        try {
            return ResponseEntity.ok(schoolService.updateTeacher(id, teacherDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable String id) {
        try {
            schoolService.deleteTeacher(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa giáo viên thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/students")
    public ResponseEntity<MemberDto> createStudent(@RequestBody MemberDto studentDto) {
        return ResponseEntity.ok(schoolService.createStudent(studentDto));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable String id, @RequestBody MemberDto studentDto) {
        try {
            return ResponseEntity.ok(schoolService.updateStudent(id, studentDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable String id) {
        try {
            schoolService.deleteStudent(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa học sinh và điểm số liên quan thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/classes")
    public ResponseEntity<List<SchoolClassDto>> getAllClasses() {
        return ResponseEntity.ok(schoolService.getAllClasses());
    }

    @PostMapping("/classes")
    public ResponseEntity<?> createClass(@RequestBody SchoolClassDto classDto) {
        try {
            SchoolClassDto createdClass = schoolService.createClass(classDto);
            return ResponseEntity.ok(createdClass);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable String id) {
        try {
            schoolService.deleteClass(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa lớp học thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/enroll/student")
    public ResponseEntity<?> enrollStudent(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        try {
            return ResponseEntity.ok(schoolService.enrollStudent(id, className));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/enroll/teacher")
    public ResponseEntity<?> enrollTeacher(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        try {
            return ResponseEntity.ok(schoolService.enrollTeacherClass(id, className));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/unenroll/teacher")
    public ResponseEntity<?> unenrollTeacher(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        try {
            return ResponseEntity.ok(schoolService.unenrollTeacherClass(id, className));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/grades")
    public ResponseEntity<?> getAllGrades(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search) {

        List<GradeDto> rawGrades = schoolService.getAllGrades();

        if (page == null) {
            return ResponseEntity.ok(rawGrades);
        }

        List<MemberDto> students = schoolService.getMembersByRole("student");
        List<Map<String, Object>> records = new ArrayList<>();

        for (MemberDto s : students) {
            GradeDto g = rawGrades.stream()
                    .filter(grade -> s.getId().equalsIgnoreCase(grade.getStudentId()))
                    .findFirst()
                    .orElse(null);

            records.add(buildStudentGradeRecord(s, g));
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            records = records.stream()
                    .filter(r -> {
                        String studentId = (String) r.get("studentId");
                        String studentName = (String) r.get("studentName");
                        String className = (String) r.get("className");
                        String email = (String) r.get("email");
                        Double math = (Double) r.get("math");
                        Double literature = (Double) r.get("literature");
                        Double english = (Double) r.get("english");
                        Double gpa = (Double) r.get("gpa");

                        return (studentId != null && studentId.toLowerCase().contains(q))
                                || (studentName != null && studentName.toLowerCase().contains(q))
                                || (className != null && className.toLowerCase().contains(q))
                                || (email != null && email.toLowerCase().contains(q))
                                || (math != null && String.valueOf(math).contains(q))
                                || (literature != null && String.valueOf(literature).contains(q))
                                || (english != null && String.valueOf(english).contains(q))
                                || (gpa != null && String.valueOf(gpa).contains(q));
                    })
                    .collect(Collectors.toList());
        }

        int p = page;
        int s = (size != null) ? size : 10;
        int totalElements = records.size();
        int totalPages = (int) Math.ceil((double) totalElements / s);
        if (totalPages == 0) totalPages = 1;

        int fromIndex = (p - 1) * s;
        int toIndex = Math.min(fromIndex + s, totalElements);

        List<Map<String, Object>> content = new ArrayList<>();
        if (fromIndex >= 0 && fromIndex < totalElements) {
            content = records.subList(fromIndex, toIndex);
        }

        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", totalElements,
                "totalPages", totalPages,
                "page", p,
                "size", s
        ));
    }

    private Map<String, Object> buildStudentGradeRecord(MemberDto student, GradeDto grade) {
        Double math = (grade != null) ? grade.getMath() : null;
        Double literature = (grade != null) ? grade.getLiterature() : null;
        Double english = (grade != null) ? grade.getEnglish() : null;

        Double gpa = null;
        int count = 0;
        double sum = 0.0;
        if (math != null) { sum += math; count++; }
        if (literature != null) { sum += literature; count++; }
        if (english != null) { sum += english; count++; }
        if (count > 0) {
            gpa = Math.round((sum / count) * 100.0) / 100.0;
        }

        Map<String, Object> record = new java.util.HashMap<>();
        record.put("studentId", student.getId());
        record.put("studentName", student.getName());
        record.put("className", (student.getClassName() != null) ? student.getClassName() : "Chưa xếp lớp");
        record.put("email", student.getEmail());
        record.put("math", math);
        record.put("literature", literature);
        record.put("english", english);
        record.put("gpa", gpa);
        return record;
    }

    @PutMapping("/grades/{studentId}")
    public ResponseEntity<GradeDto> saveGrade(@PathVariable String studentId, @RequestBody GradeDto gradeDto) {
        return ResponseEntity.ok(schoolService.saveGrade(studentId, gradeDto));
    }

    @DeleteMapping("/grades/{studentId}")
    public ResponseEntity<?> deleteGrade(@PathVariable String studentId) {
        try {
            schoolService.deleteGrade(studentId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa trắng điểm số thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/grades/{studentId}/subject/{subject}")
    public ResponseEntity<?> deleteSubjectGrade(@PathVariable String studentId, @PathVariable String subject) {
        schoolService.deleteSubjectGrade(studentId, subject);
        return ResponseEntity.ok(Map.of("message", "Đã xóa điểm môn học thành công."));
    }

    @GetMapping("/queries/grades/excellent/math")
    public ResponseEntity<List<GradeDto>> getExcellentMathStudents(@RequestParam(defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentMathStudents(minScore));
    }

    @GetMapping("/queries/grades/excellent/literature")
    public ResponseEntity<List<GradeDto>> getExcellentLiteratureStudents(@RequestParam(defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentLiteratureStudents(minScore));
    }

    @GetMapping("/queries/grades/excellent/english")
    public ResponseEntity<List<GradeDto>> getExcellentEnglishStudents(@RequestParam(defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentEnglishStudents(minScore));
    }

    @GetMapping("/queries/grades/complete")
    public ResponseEntity<List<GradeDto>> getStudentsWithCompleteGrades() {
        return ResponseEntity.ok(schoolService.getStudentsWithCompleteGrades());
    }

    @GetMapping("/queries/members/role/{role}")
    public ResponseEntity<List<MemberDto>> getMembersByRole(@PathVariable String role) {
        return ResponseEntity.ok(schoolService.getMembersByRole(role));
    }

    @GetMapping("/queries/members/role/{role}/class/{className}")
    public ResponseEntity<List<MemberDto>> getMembersByRoleAndClassName(@PathVariable String role, @PathVariable String className) {
        return ResponseEntity.ok(schoolService.getMembersByRoleAndClassName(role, className));
    }

    @GetMapping("/queries/members/role/{role}/subject/{subject}")
    public ResponseEntity<List<MemberDto>> getMembersByRoleAndSubject(@PathVariable String role, @PathVariable String subject) {
        return ResponseEntity.ok(schoolService.getMembersByRoleAndSubject(role, subject));
    }

    @GetMapping("/queries/members/teachers/class/{classId}")
    public ResponseEntity<List<MemberDto>> getTeachersByClassId(@PathVariable String classId) {
        return ResponseEntity.ok(schoolService.getTeachersByClassId(classId));
    }

    @GetMapping("/queries/members/search")
    public ResponseEntity<List<MemberDto>> searchMembersByName(@RequestParam String keyword) {
        return ResponseEntity.ok(schoolService.searchMembersByName(keyword));
    }

    @GetMapping("/queries/classes/by-name/{name}")
    public ResponseEntity<SchoolClassDto> getClassByName(@PathVariable String name) {
        SchoolClassDto schoolClassDto = schoolService.getClassByName(name);
        if (schoolClassDto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(schoolClassDto);
    }

    @GetMapping("/queries/classes/exists/{name}")
    public ResponseEntity<Map<String, Boolean>> existsClassByName(@PathVariable String name) {
        boolean exists = schoolService.existsClassByName(name);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
