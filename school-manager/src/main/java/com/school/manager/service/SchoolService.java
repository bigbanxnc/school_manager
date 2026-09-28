package com.school.manager.service;

import com.school.manager.dto.ChangePasswordRequestDto;
import com.school.manager.dto.GradeDto;
import com.school.manager.dto.LoginRequestDto;
import com.school.manager.dto.MemberDto;
import com.school.manager.dto.SchoolClassDto;

import java.util.List;
import java.util.Map;

public interface SchoolService {

    MemberDto login(LoginRequestDto credentials);

    void changePassword(ChangePasswordRequestDto request, String authenticatedEmail);

    List<MemberDto> getAllMembers();

    MemberDto createTeacher(MemberDto teacherDto);
    MemberDto updateTeacher(String id, MemberDto teacherDto);
    void deleteTeacher(String id);

    MemberDto createStudent(MemberDto studentDto);
    MemberDto updateStudent(String id, MemberDto studentDto);
    void deleteStudent(String id);

    List<SchoolClassDto> getAllClasses();
    SchoolClassDto createClass(SchoolClassDto classDto);
    void deleteClass(String id);

    MemberDto enrollStudent(String studentId, String className);
    MemberDto enrollTeacherClass(String teacherId, String className);
    MemberDto unenrollTeacherClass(String teacherId, String className);

    List<GradeDto> getAllGrades();
    GradeDto saveGrade(String studentId, GradeDto gradeDto);
    void deleteGrade(String studentId);
    void deleteSubjectGrade(String studentId, String subject);

    List<GradeDto> getExcellentMathStudents(Double minScore);
    List<GradeDto> getExcellentLiteratureStudents(Double minScore);
    List<GradeDto> getExcellentEnglishStudents(Double minScore);
    List<GradeDto> getStudentsWithCompleteGrades();

    List<MemberDto> getMembersByRole(String role);
    List<MemberDto> getMembersByRoleAndClassName(String role, String className);
    List<MemberDto> getMembersByRoleAndSubject(String role, String subject);
    List<MemberDto> getTeachersByClassId(String classId);
    List<MemberDto> searchMembersByName(String keyword);

    String getNextId(String role);

    Object getMembersResponse(Integer page, Integer size, String role, String search, String classes, String currentUserId);
    Object getTeachersResponse(Integer page, Integer size, String search);
    Object getGradesResponse(Integer page, Integer size, String search, String classes, String currentUserId, String scoreSubject, String scoreOp, Double scoreVal);
    Map<String, Object> getStudentGradeRecord(String studentId, String currentUserId);
    Map<String, Object> saveGradeRecord(String studentId, GradeDto gradeDto);

    MemberDto getMemberById(String id);
    MemberDto getTeacherById(String id);
    MemberDto getStudentById(String id);
    SchoolClassDto getClassById(String id);

    SchoolClassDto getClassByName(String name);
    boolean existsClassByName(String name);
    List<MemberDto> autoAssignTeachers();
    MemberDto autoAssignSingleTeacher(String teacherId);

    com.school.manager.dto.ResetPasswordResponseDto resetPasswordByAdmin(String userId, String currentAdminRole);
    MemberDto forceChangePassword(com.school.manager.dto.ForceChangePasswordRequestDto request, String authenticatedEmail);
}
