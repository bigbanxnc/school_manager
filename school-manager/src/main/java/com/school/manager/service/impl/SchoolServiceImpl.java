package com.school.manager.service.impl;

import com.school.manager.dto.*;
import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import com.school.manager.entity.SchoolClass;
import com.school.manager.mapper.GradeMapper;
import com.school.manager.mapper.MemberMapper;
import com.school.manager.mapper.SchoolClassMapper;
import com.school.manager.repository.GradeRepository;
import com.school.manager.repository.MemberRepository;
import com.school.manager.repository.SchoolClassRepository;
import com.school.manager.service.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SchoolServiceImpl implements SchoolService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private SchoolClassRepository classRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private MemberMapper memberMapper;

    @Autowired
    private GradeMapper gradeMapper;

    @Autowired
    private SchoolClassMapper classMapper;

    @Override
    public MemberDto login(LoginRequestDto credentials) {
        if (credentials == null || credentials.getEmail() == null || credentials.getPassword() == null) {
            throw new IllegalArgumentException("Email và mật khẩu không được để trống!");
        }

        Optional<Member> memberOpt = memberRepository.findByEmailIgnoreCase(credentials.getEmail().trim());
        if (memberOpt.isPresent() && memberOpt.get().getPassword().equals(credentials.getPassword())) {
            return memberMapper.toDto(memberOpt.get());
        }
        throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
    }

    @Override
    public List<MemberDto> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public MemberDto createTeacher(MemberDto teacherDto) {
        Member entity = memberMapper.toEntity(teacherDto);
        entity.setRole("teacher");
        if (entity.getId() == null || entity.getId().trim().isEmpty()) {
            entity.setId("GV" + System.currentTimeMillis() % 100000);
        }
        if (entity.getAssignedClasses() == null) {
            entity.setAssignedClasses(new ArrayList<>());
        }
        Member saved = memberRepository.save(entity);
        return memberMapper.toDto(saved);
    }

    @Override
    public MemberDto updateTeacher(String id, MemberDto teacherDto) {
        return memberRepository.findById(id).map(teacher -> {
            teacher.setName(teacherDto.getName());
            teacher.setEmail(teacherDto.getEmail());
            teacher.setPassword(teacherDto.getPassword());
            teacher.setSubject(teacherDto.getSubject());
            if (teacherDto.getAssignedClasses() != null) {
                teacher.setAssignedClasses(new ArrayList<>(teacherDto.getAssignedClasses()));
            }
            return memberMapper.toDto(memberRepository.save(teacher));
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy giáo viên với ID: " + id));
    }

    @Override
    public void deleteTeacher(String id) {
        if (!memberRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy giáo viên với ID: " + id);
        }
        memberRepository.deleteById(id);
    }

    @Override
    public MemberDto createStudent(MemberDto studentDto) {
        Member entity = memberMapper.toEntity(studentDto);
        entity.setRole("student");
        if (entity.getId() == null || entity.getId().trim().isEmpty()) {
            entity.setId("HS" + System.currentTimeMillis() % 100000);
        }
        Member saved = memberRepository.save(entity);
        return memberMapper.toDto(saved);
    }

    @Override
    public MemberDto updateStudent(String id, MemberDto studentDto) {
        return memberRepository.findById(id).map(student -> {
            student.setName(studentDto.getName());
            student.setEmail(studentDto.getEmail());
            student.setPassword(studentDto.getPassword());
            student.setClassName(studentDto.getClassName());
            return memberMapper.toDto(memberRepository.save(student));
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh với ID: " + id));
    }

    @Override
    public void deleteStudent(String id) {
        if (!memberRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy học sinh với ID: " + id);
        }
        memberRepository.deleteById(id);
        if (gradeRepository.existsById(id)) {
            gradeRepository.deleteById(id);
        }
    }

    @Override
    public List<SchoolClassDto> getAllClasses() {
        return classRepository.findAll().stream()
                .map(classMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public SchoolClassDto createClass(SchoolClassDto classDto) {
        if (classDto == null || classDto.getId() == null || classDto.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã lớp không hợp lệ!");
        }
        String idUpper = classDto.getId().trim().toUpperCase();
        if (classRepository.existsById(idUpper)) {
            throw new RuntimeException("Mã lớp " + idUpper + " đã tồn tại trong hệ thống!");
        }

        SchoolClass entity = classMapper.toEntity(classDto);
        entity.setId(idUpper);
        if (entity.getName() == null || entity.getName().trim().isEmpty()) {
            entity.setName("Lớp " + idUpper);
        }

        SchoolClass saved = classRepository.save(entity);
        return classMapper.toDto(saved);
    }

    @Override
    public void deleteClass(String id) {
        if (!classRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy lớp học với ID: " + id);
        }

        List<Member> students = memberRepository.findAll().stream()
                .filter(m -> "student".equals(m.getRole()) && id.equals(m.getClassName()))
                .toList();
        for (Member s : students) {
            s.setClassName(null);
            memberRepository.save(s);
        }

        List<Member> teachers = memberRepository.findAll().stream()
                .filter(m -> "teacher".equals(m.getRole()) && m.getAssignedClasses() != null && m.getAssignedClasses().contains(id))
                .toList();
        for (Member t : teachers) {
            t.getAssignedClasses().remove(id);
            memberRepository.save(t);
        }

        classRepository.deleteById(id);
    }

    @Override
    public MemberDto enrollStudent(String studentId, String className) {
        return memberRepository.findById(studentId).map(student -> {
            student.setClassName(className);
            return memberMapper.toDto(memberRepository.save(student));
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh với ID: " + studentId));
    }

    @Override
    public MemberDto enrollTeacherClass(String teacherId, String className) {
        return memberRepository.findById(teacherId).map(teacher -> {
            if (teacher.getAssignedClasses() == null) {
                teacher.setAssignedClasses(new ArrayList<>());
            }
            if (!teacher.getAssignedClasses().contains(className)) {
                teacher.getAssignedClasses().add(className);
            }
            return memberMapper.toDto(memberRepository.save(teacher));
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy giáo viên với ID: " + teacherId));
    }

    @Override
    public MemberDto unenrollTeacherClass(String teacherId, String className) {
        return memberRepository.findById(teacherId).map(teacher -> {
            if (teacher.getAssignedClasses() != null) {
                teacher.getAssignedClasses().remove(className);
            }
            return memberMapper.toDto(memberRepository.save(teacher));
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy giáo viên với ID: " + teacherId));
    }

    @Override
    public List<GradeDto> getAllGrades() {
        return gradeRepository.findAll().stream()
                .map(gradeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public GradeDto saveGrade(String studentId, GradeDto gradeDto) {
        Grade fromDto = gradeMapper.toEntity(gradeDto);
        Grade grade = gradeRepository.findById(studentId).orElse(new Grade());
        grade.setStudentId(studentId);

        if (fromDto != null) {
            if (fromDto.getMath() != null) grade.setMath(fromDto.getMath());
            if (fromDto.getLiterature() != null) grade.setLiterature(fromDto.getLiterature());
            if (fromDto.getEnglish() != null) grade.setEnglish(fromDto.getEnglish());
        }

        Grade saved = gradeRepository.save(grade);
        return gradeMapper.toDto(saved);
    }

    @Override
    public void deleteGrade(String studentId) {
        if (!gradeRepository.existsById(studentId)) {
            throw new RuntimeException("Không tìm thấy bảng điểm của học sinh: " + studentId);
        }
        gradeRepository.deleteById(studentId);
    }

    @Override
    public void deleteSubjectGrade(String studentId, String subject) {
        gradeRepository.findById(studentId).ifPresent(grade -> {
            if ("math".equalsIgnoreCase(subject)) grade.setMath(null);
            else if ("literature".equalsIgnoreCase(subject)) grade.setLiterature(null);
            else if ("english".equalsIgnoreCase(subject)) grade.setEnglish(null);
            gradeRepository.save(grade);
        });
    }

    @Override
    public List<GradeDto> getExcellentMathStudents(Double minScore) {
        return gradeRepository.findExcellentMathStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GradeDto> getExcellentLiteratureStudents(Double minScore) {
        return gradeRepository.findExcellentLiteratureStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GradeDto> getExcellentEnglishStudents(Double minScore) {
        return gradeRepository.findExcellentEnglishStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GradeDto> getStudentsWithCompleteGrades() {
        return gradeRepository.findStudentsWithCompleteGrades().stream()
                .map(gradeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberDto> getMembersByRole(String role) {
        return memberRepository.findByRole(role).stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberDto> getMembersByRoleAndClassName(String role, String className) {
        return memberRepository.findByRoleAndClassName(role, className).stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberDto> getMembersByRoleAndSubject(String role, String subject) {
        return memberRepository.findByRoleAndSubject(role, subject).stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberDto> getTeachersByClassId(String classId) {
        return memberRepository.findTeachersByClassId(classId).stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberDto> searchMembersByName(String keyword) {
        return memberRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public SchoolClassDto getClassByName(String name) {
        return classRepository.findByNameIgnoreCase(name)
                .map(classMapper::toDto)
                .orElse(null);
    }

    @Override
    public boolean existsClassByName(String name) {
        return classRepository.existsByNameIgnoreCase(name);
    }
}
