package com.school.manager.service;

import com.school.manager.dto.*;

import java.util.List;

public interface SchoolService {

    MemberDto login(LoginRequestDto credentials);
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

    SchoolClassDto getClassByName(String name);
    boolean existsClassByName(String name);
}
