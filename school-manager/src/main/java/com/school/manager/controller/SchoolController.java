package com.school.manager.controller;

import com.school.manager.dto.ChangePasswordRequestDto;
import com.school.manager.dto.GradeDto;
import com.school.manager.dto.LoginRequestDto;
import com.school.manager.dto.MemberDto;
import com.school.manager.dto.SchoolClassDto;
import com.school.manager.exception.GlobalExceptionHandler.AppException;
import com.school.manager.service.SchoolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @PostMapping({"/login", "/auth/login"})
    public ResponseEntity<MemberDto> login(@Valid @RequestBody LoginRequestDto credentials) {
        return ResponseEntity.ok(schoolService.login(credentials));
    }

    @PostMapping({"/admin/users/{id}/reset-password", "/members/{id}/reset-password"})
    public ResponseEntity<com.school.manager.dto.ResetPasswordResponseDto> resetPassword(
            @PathVariable("id") String id,
            @RequestHeader(value = "X-Current-User-Role", required = false) String currentUserRole) {
        return ResponseEntity.ok(schoolService.resetPasswordByAdmin(id, currentUserRole));
    }

    @PostMapping({"/auth/force-change-password", "/force-change-password"})
    public ResponseEntity<MemberDto> forceChangePassword(
            @Valid @RequestBody com.school.manager.dto.ForceChangePasswordRequestDto request,
            @RequestHeader(value = "X-Current-User-Email", required = false) String currentUserEmail) {
        return ResponseEntity.ok(schoolService.forceChangePassword(request, currentUserEmail));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDto request,
            @RequestHeader(value = "X-Current-User-Email", required = false) String currentUserEmail) {
        schoolService.changePassword(request, currentUserEmail);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công.", "success", true));
    }

    @GetMapping("/members")
    public ResponseEntity<?> getAllMembers(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "classes", required = false) String classes,
            @RequestParam(value = "currentUserId", required = false) String currentUserId) {
        return ResponseEntity.ok(schoolService.getMembersResponse(page, size, role, search, classes, currentUserId));
    }

    @GetMapping("/members/{id}")
    public ResponseEntity<MemberDto> getMemberById(@PathVariable("id") String id) {
        return ResponseEntity.ok(schoolService.getMemberById(id));
    }

    @GetMapping("/next-id")
    public ResponseEntity<Map<String, String>> getNextId(@RequestParam(value = "role", defaultValue = "student") String role) {
        String nextId = schoolService.getNextId(role);
        return ResponseEntity.ok(Map.of("nextId", nextId));
    }

    @GetMapping("/teachers")
    public ResponseEntity<?> getAllTeachers(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(schoolService.getTeachersResponse(page, size, search));
    }

    @GetMapping("/teachers/{id}")
    public ResponseEntity<MemberDto> getTeacherById(@PathVariable("id") String id) {
        return ResponseEntity.ok(schoolService.getTeacherById(id));
    }

    @PostMapping("/teachers")
    public ResponseEntity<MemberDto> createTeacher(@RequestBody MemberDto teacherDto) {
        return ResponseEntity.ok(schoolService.createTeacher(teacherDto));
    }

    @PutMapping("/teachers/{id}")
    public ResponseEntity<MemberDto> updateTeacher(@PathVariable("id") String id, @RequestBody MemberDto teacherDto) {
        return ResponseEntity.ok(schoolService.updateTeacher(id, teacherDto));
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<Map<String, String>> deleteTeacher(@PathVariable("id") String id) {
        schoolService.deleteTeacher(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa giáo viên thành công."));
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<MemberDto> getStudentById(@PathVariable("id") String id) {
        return ResponseEntity.ok(schoolService.getStudentById(id));
    }

    @PostMapping("/students")
    public ResponseEntity<MemberDto> createStudent(@RequestBody MemberDto studentDto) {
        return ResponseEntity.ok(schoolService.createStudent(studentDto));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<MemberDto> updateStudent(@PathVariable("id") String id, @RequestBody MemberDto studentDto) {
        return ResponseEntity.ok(schoolService.updateStudent(id, studentDto));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable("id") String id) {
        schoolService.deleteStudent(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa học sinh và điểm số liên quan thành công."));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<SchoolClassDto>> getAllClasses() {
        return ResponseEntity.ok(schoolService.getAllClasses());
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<SchoolClassDto> getClassById(@PathVariable("id") String id) {
        return ResponseEntity.ok(schoolService.getClassById(id));
    }

    @PostMapping("/classes")
    public ResponseEntity<SchoolClassDto> createClass(@RequestBody SchoolClassDto classDto) {
        return ResponseEntity.ok(schoolService.createClass(classDto));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Map<String, String>> deleteClass(@PathVariable("id") String id) {
        schoolService.deleteClass(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa lớp học thành công."));
    }

    @PostMapping("/enroll/student")
    public ResponseEntity<MemberDto> enrollStudent(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        return ResponseEntity.ok(schoolService.enrollStudent(id, className));
    }

    @PostMapping("/enroll/teacher")
    public ResponseEntity<MemberDto> enrollTeacher(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        return ResponseEntity.ok(schoolService.enrollTeacherClass(id, className));
    }

    @PostMapping("/unenroll/student")
    public ResponseEntity<MemberDto> unenrollStudent(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        return ResponseEntity.ok(schoolService.enrollStudent(id, null));
    }

    @PostMapping("/unenroll/teacher")
    public ResponseEntity<MemberDto> unenrollTeacher(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String className = payload.get("className");
        return ResponseEntity.ok(schoolService.unenrollTeacherClass(id, className));
    }

    @PostMapping("/teachers/auto-assign")
    public ResponseEntity<List<MemberDto>> autoAssignTeachers() {
        return ResponseEntity.ok(schoolService.autoAssignTeachers());
    }

    @PostMapping("/teachers/{id}/auto-assign")
    public ResponseEntity<MemberDto> autoAssignSingleTeacher(@PathVariable("id") String id) {
        return ResponseEntity.ok(schoolService.autoAssignSingleTeacher(id));
    }

    @GetMapping("/grades")
    public ResponseEntity<?> getAllGrades(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "classes", required = false) String classes,
            @RequestParam(value = "currentUserId", required = false) String currentUserId,
            @RequestParam(value = "scoreSubject", required = false) String scoreSubject,
            @RequestParam(value = "scoreOp", required = false) String scoreOp,
            @RequestParam(value = "scoreVal", required = false) Double scoreVal) {
        return ResponseEntity.ok(schoolService.getGradesResponse(page, size, search, classes, currentUserId, scoreSubject, scoreOp, scoreVal));
    }

    @GetMapping("/grades/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentGrade(
            @PathVariable("studentId") String studentId,
            @RequestParam(value = "currentUserId", required = false) String currentUserId) {
        return ResponseEntity.ok(schoolService.getStudentGradeRecord(studentId, currentUserId));
    }

    @PutMapping("/grades/{studentId}")
    public ResponseEntity<Map<String, Object>> saveGrade(@PathVariable("studentId") String studentId, @RequestBody GradeDto gradeDto) {
        return ResponseEntity.ok(schoolService.saveGradeRecord(studentId, gradeDto));
    }

    @DeleteMapping("/grades/{studentId}")
    public ResponseEntity<Map<String, String>> deleteGrade(@PathVariable("studentId") String studentId) {
        schoolService.deleteGrade(studentId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa trắng điểm số thành công."));
    }

    @DeleteMapping("/grades/{studentId}/subject/{subject}")
    public ResponseEntity<Map<String, String>> deleteSubjectGrade(@PathVariable("studentId") String studentId, @PathVariable("subject") String subject) {
        schoolService.deleteSubjectGrade(studentId, subject);
        return ResponseEntity.ok(Map.of("message", "Đã xóa điểm môn học thành công."));
    }

    @GetMapping("/queries/grades/excellent/math")
    public ResponseEntity<List<GradeDto>> getExcellentMathStudents(@RequestParam(value = "minScore", defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentMathStudents(minScore));
    }

    @GetMapping("/queries/grades/excellent/literature")
    public ResponseEntity<List<GradeDto>> getExcellentLiteratureStudents(@RequestParam(value = "minScore", defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentLiteratureStudents(minScore));
    }

    @GetMapping("/queries/grades/excellent/english")
    public ResponseEntity<List<GradeDto>> getExcellentEnglishStudents(@RequestParam(value = "minScore", defaultValue = "8.0") Double minScore) {
        return ResponseEntity.ok(schoolService.getExcellentEnglishStudents(minScore));
    }

    @GetMapping("/queries/grades/complete")
    public ResponseEntity<List<GradeDto>> getStudentsWithCompleteGrades() {
        return ResponseEntity.ok(schoolService.getStudentsWithCompleteGrades());
    }

    @GetMapping("/queries/members/role/{role}")
    public ResponseEntity<List<MemberDto>> getMembersByRole(@PathVariable("role") String role) {
        return ResponseEntity.ok(schoolService.getMembersByRole(role));
    }

    @GetMapping("/queries/members/role/{role}/class/{className}")
    public ResponseEntity<List<MemberDto>> getMembersByRoleAndClassName(@PathVariable("role") String role, @PathVariable("className") String className) {
        return ResponseEntity.ok(schoolService.getMembersByRoleAndClassName(role, className));
    }

    @GetMapping("/queries/members/role/{role}/subject/{subject}")
    public ResponseEntity<List<MemberDto>> getMembersByRoleAndSubject(@PathVariable("role") String role, @PathVariable("subject") String subject) {
        return ResponseEntity.ok(schoolService.getMembersByRoleAndSubject(role, subject));
    }

    @GetMapping("/queries/members/teachers/class/{classId}")
    public ResponseEntity<List<MemberDto>> getTeachersByClassId(@PathVariable("classId") String classId) {
        return ResponseEntity.ok(schoolService.getTeachersByClassId(classId));
    }

    @GetMapping("/queries/members/search")
    public ResponseEntity<List<MemberDto>> searchMembersByName(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(schoolService.searchMembersByName(keyword));
    }

    @GetMapping("/queries/classes/by-name/{name}")
    public ResponseEntity<SchoolClassDto> getClassByName(@PathVariable("name") String name) {
        SchoolClassDto schoolClassDto = schoolService.getClassByName(name);
        if (schoolClassDto == null) {
            throw AppException.notFound("Không tìm thấy lớp học với tên: " + name);
        }
        return ResponseEntity.ok(schoolClassDto);
    }

    @GetMapping("/queries/classes/exists/{name}")
    public ResponseEntity<Map<String, Boolean>> existsClassByName(@PathVariable("name") String name) {
        boolean exists = schoolService.existsClassByName(name);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
