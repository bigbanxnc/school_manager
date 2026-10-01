package com.school.manager.service.impl;

import com.school.manager.dto.*;
import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import com.school.manager.entity.SchoolClass;
import com.school.manager.exception.GlobalExceptionHandler.AppException;
import com.school.manager.mapper.GradeMapper;
import com.school.manager.mapper.MemberMapper;
import com.school.manager.mapper.SchoolClassMapper;
import com.school.manager.repository.GradeRepository;
import com.school.manager.repository.MemberRepository;
import com.school.manager.repository.SchoolClassRepository;
import com.school.manager.service.SchoolService;
import com.school.manager.specification.MemberSpecification;
import com.school.manager.util.PasswordGenerator;
import com.school.manager.util.PasswordUtil;
import com.school.manager.util.ScoreUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Consumer;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SchoolServiceImpl implements SchoolService {

    private final MemberRepository memberRepository;
    private final SchoolClassRepository classRepository;
    private final GradeRepository gradeRepository;
    private final MemberMapper memberMapper;
    private final GradeMapper gradeMapper;
    private final SchoolClassMapper classMapper;

    @Override
    public MemberDto login(LoginRequestDto credentials) {
        if (credentials == null || credentials.getEmail() == null || credentials.getPassword() == null) {
            throw AppException.badRequest("Email và mật khẩu không được để trống!");
        }

        String email = credentials.getEmail().trim();
        String password = credentials.getPassword();

        Member member = memberRepository.findByEmailIgnoreCase(email).orElse(null);

        // Chống rò rỉ và dò quét tài khoản: Đồng nhất thông báo lỗi duy nhất cho cả hai trường hợp
        // "Email không tồn tại" và "Sai mật khẩu", ngăn chặn hoàn toàn nguy cơ thu thập danh tính người dùng.
        if (member == null || !PasswordUtil.matches(password, member.getPassword())) {
            Map<String, String> errors = new LinkedHashMap<>();
            errors.put("email", "Email hoặc mật khẩu không chính xác!");
            errors.put("password", "Email hoặc mật khẩu không chính xác!");
            throw AppException.unauthorized("Email hoặc mật khẩu không chính xác!", errors);
        }

        return memberMapper.toDto(member);
    }

    @Override
    public void changePassword(ChangePasswordRequestDto request, String authenticatedEmail) {
        if (request == null) {
            throw AppException.badRequest("Vui lòng điền đầy đủ thông tin!");
        }

        // Kiểm soát quyền sở hữu: Bổ sung bước đối chiếu bắt buộc giữa email trong yêu cầu với
        // danh tính thực tế của tài khoản đang đăng nhập; chỉ chấp thuận khi hai thông tin trùng khớp.
        if (authenticatedEmail != null && !authenticatedEmail.trim().isEmpty()) {
            if (!request.getEmail().trim().equalsIgnoreCase(authenticatedEmail.trim())) {
                throw AppException.forbidden("Bạn không có quyền thay đổi mật khẩu của tài khoản khác!",
                        Map.of("email", "Không được phép thay đổi mật khẩu của tài khoản khác."));
            }
        }

        if (!request.isConfirmPassword()) {
            throw AppException.badRequest("Mật khẩu xác nhận không khớp!",
                    Map.of("confirmPassword", "Mật khẩu xác nhận không khớp!"));
        }

        // Tự động hóa kiểm tra dữ liệu đổi mật khẩu đã được xử lý bởi Bean Validation (@Valid) tại Controller.
        // Tầng Service chỉ tập trung xử lý nghiệp vụ kiểm tra tài khoản và mật khẩu hiện tại.
        Member member = memberRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản với email này!",
                        Map.of("email", "Không tìm thấy tài khoản với email hoặc mã này.")));

        if (!PasswordUtil.matches(request.getOldPassword(), member.getPassword())) {
            throw AppException.badRequest("Mật khẩu hiện tại không chính xác!",
                    Map.of("oldPassword", "Mật khẩu hiện tại không chính xác."));
        }

        if (PasswordUtil.matches(request.getNewPassword(), member.getPassword())
                || (request.getOldPassword() != null && request.getNewPassword().trim().equals(request.getOldPassword().trim()))) {
            throw AppException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại!",
                    Map.of("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại."));
        }

        member.setPassword(PasswordUtil.ensureSha1(request.getNewPassword().trim()));
        member.setMustChangePassword(false);
        memberRepository.save(member);
    }

    @Override
    public com.school.manager.dto.ResetPasswordResponseDto resetPasswordByAdmin(String userId, String currentAdminRole) {
        if (currentAdminRole != null && !currentAdminRole.trim().isEmpty() && !"admin".equalsIgnoreCase(currentAdminRole.trim())) {
            throw AppException.forbidden("Chỉ có Quản trị viên (Admin) mới có quyền reset mật khẩu!");
        }

        if (userId == null || userId.trim().isEmpty()) {
            throw AppException.badRequest("Mã người dùng không được để trống!");
        }

        Member member = memberRepository.findByIdOrCode(userId)
                .or(() -> memberRepository.findByEmailIgnoreCase(userId.trim()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản với mã/ID: " + userId));

        // Sinh mật khẩu ngẫu nhiên 10 ký tự: A-Z, a-z, 0-9 bằng SecureRandom
        String rawPassword = PasswordGenerator.generatePassword();
        member.setPassword(PasswordUtil.ensureSha1(rawPassword));
        member.setMustChangePassword(true);
        memberRepository.save(member);

        return com.school.manager.dto.ResetPasswordResponseDto.builder()
                .userId(String.valueOf(member.getId()))
                .code(member.getCode())
                .email(member.getEmail())
                .name(member.getName())
                .newPassword(rawPassword)
                .mustChangePassword(true)
                .message("Reset mật khẩu thành công. Mật khẩu mới gồm 10 ký tự an toàn.")
                .build();
    }

    @Override
    public MemberDto forceChangePassword(com.school.manager.dto.ForceChangePasswordRequestDto request, String authenticatedEmail) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            throw AppException.badRequest("Mật khẩu mới không được để trống!",
                    Map.of("newPassword", "Mật khẩu mới không được để trống!"));
        }

        if (request.getNewPassword().trim().length() < 6) {
            throw AppException.badRequest("Mật khẩu mới phải có ít nhất 6 ký tự!",
                    Map.of("newPassword", "Mật khẩu mới phải có ít nhất 6 ký tự!"));
        }

        if (request.getConfirmPassword() != null && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw AppException.badRequest("Mật khẩu xác nhận không khớp!",
                    Map.of("confirmPassword", "Mật khẩu xác nhận không khớp!"));
        }

        String targetIdentifier = request.getEmail();
        if ((targetIdentifier == null || targetIdentifier.trim().isEmpty()) && request.getUserId() != null) {
            targetIdentifier = request.getUserId();
        }
        if ((targetIdentifier == null || targetIdentifier.trim().isEmpty()) && authenticatedEmail != null) {
            targetIdentifier = authenticatedEmail;
        }

        if (targetIdentifier == null || targetIdentifier.trim().isEmpty()) {
            throw AppException.badRequest("Không tìm thấy thông tin tài khoản cần đổi mật khẩu!");
        }

        final String cleanTargetId = targetIdentifier.trim();
        Member member = memberRepository.findByIdOrCode(cleanTargetId)
                .or(() -> memberRepository.findByEmailIgnoreCase(cleanTargetId))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản tương ứng!",
                        Map.of("email", "Không tìm thấy tài khoản tương ứng.")));

        if (request.getOldPassword() != null && !request.getOldPassword().trim().isEmpty()) {
            String hashedInputOld = PasswordUtil.ensureSha1(request.getOldPassword().trim());
            if (!member.getPassword().equalsIgnoreCase(hashedInputOld) && !member.getPassword().equals(request.getOldPassword().trim())) {
                throw AppException.badRequest("Mật khẩu hiện tại không chính xác!",
                        Map.of("oldPassword", "Mật khẩu hiện tại không chính xác!"));
            }
        }

        if (PasswordUtil.matches(request.getNewPassword(), member.getPassword())
                || (request.getOldPassword() != null && request.getNewPassword().trim().equals(request.getOldPassword().trim()))) {
            throw AppException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại!",
                    Map.of("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại."));
        }

        member.setPassword(PasswordUtil.ensureSha1(request.getNewPassword().trim()));
        member.setMustChangePassword(false);
        Member saved = memberRepository.save(member);
        return memberMapper.toDto(saved);
    }

    @Override
    public String getNextId(String role) {
        List<Member> members = memberRepository.findByRole(role);
        int nextNum = extractMaxNumberFromMembers(members) + 1;

        String normalizedRole = (role != null) ? role.trim().toLowerCase() : "";
        String prefix = switch (normalizedRole) {
            case "teacher" -> "GV";
            case "student" -> "HS";
            default -> "MEM";
        };
        int padLength = "student".equals(normalizedRole) ? 3 : 2;

        return prefix + String.format("%0" + padLength + "d", nextNum);
    }

    private int extractMaxNumberFromMembers(List<Member> members) {
        int maxNum = 0;
        for (Member m : members) {
            String code = m.getCode();
            if (code != null) {
                String numStr = code.replaceAll("\\D+", "");
                if (!numStr.isEmpty()) {
                    try {
                        int num = Integer.parseInt(numStr);
                        if (num > maxNum) {
                            maxNum = num;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return maxNum;
    }

    @Override
    public List<MemberDto> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public Object getMembersResponse(Integer page, Integer size, String role, String search, String classes, String currentUserId) {
        int p = (page != null && page > 0) ? page : 1;
        int s = (size != null && size > 0 && size <= 100) ? size : 10;
        Pageable pageable = PageRequest.of(p - 1, s);

        List<String> classList = new ArrayList<>();
        boolean hasClasses = false;
        if (classes != null && !classes.trim().isEmpty()) {
            classList = Arrays.asList(classes.split(","));
            hasClasses = true;
        }

        String searchKeyword = "";
        boolean hasSearch = false;
        if (search != null && !search.trim().isEmpty()) {
            searchKeyword = search.trim();
            hasSearch = true;
        }

        String roleParam = (role != null && !role.trim().isEmpty()) ? role.trim() : null;

        Page<Member> membersPage = memberRepository.findAll(
                MemberSpecification.filterMembers(roleParam, classList, hasClasses, currentUserId, searchKeyword, hasSearch),
                pageable);

        List<MemberDto> content = membersPage.getContent().stream()
                .map(memberMapper::toDto)
                .toList();

        long totalElements = membersPage.getTotalElements();
        int totalPages = membersPage.getTotalPages();
        if (totalElements == 0) {
            totalPages = 1;
        }
        return PageResponse.<MemberDto>builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .page(p)
                .size(s)
                .build();
    }

    @Override
    public Object getTeachersResponse(Integer page, Integer size, String search) {
        int p = (page != null && page > 0) ? page : 1;
        int s = (size != null && size > 0 && size <= 100) ? size : 10;
        Pageable pageable = PageRequest.of(p - 1, s);

        String searchKeyword = "";
        boolean hasSearch = false;
        if (search != null && !search.trim().isEmpty()) {
            searchKeyword = search.trim();
            hasSearch = true;
        }

        Page<Member> membersPage = memberRepository.findAll(
                MemberSpecification.filterMembers("teacher", null, false, null, searchKeyword, hasSearch),
                pageable);

        List<MemberDto> content = membersPage.getContent().stream()
                .map(memberMapper::toDto)
                .toList();

        long totalElements = membersPage.getTotalElements();
        int totalPages = membersPage.getTotalPages();
        if (totalElements == 0) {
            totalPages = 1;
        }
        return PageResponse.<MemberDto>builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .page(p)
                .size(s)
                .build();
    }

    @Override
    public MemberDto createTeacher(MemberDto teacherDto) {
        Member entity = memberMapper.toEntity(teacherDto);
        entity.setId(null);
        entity.setRole("teacher");
        entity.setCode((entity.getCode() == null || entity.getCode().trim().isEmpty())
                ? getNextId("teacher")
                : entity.getCode().trim());
        if (entity.getAssignedClasses() == null) {
            entity.setAssignedClasses(new ArrayList<>());
        }
        String rawTeacherPass = (entity.getPassword() != null && !entity.getPassword().trim().isEmpty())
                ? entity.getPassword().trim()
                : PasswordGenerator.generatePassword();
        entity.setPassword(PasswordUtil.ensureSha1(rawTeacherPass));
        Member saved = memberRepository.save(entity);
        return memberMapper.toDto(saved);
    }

    @Override
    public MemberDto updateTeacher(String id, MemberDto teacherDto) {
        Member teacher = memberRepository.findByIdOrCode(id)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên với ID: " + id));

        teacher.setName(teacherDto.getName());
        teacher.setEmail(teacherDto.getEmail());
        if (teacherDto.getPassword() != null && !teacherDto.getPassword().trim().isEmpty()) {
            teacher.setPassword(PasswordUtil.ensureSha1(teacherDto.getPassword()));
        }
        teacher.setSubject(teacherDto.getSubject());
        if (teacherDto.getAssignedClasses() != null) {
            teacher.setAssignedClasses(new ArrayList<>(teacherDto.getAssignedClasses()));
        }
        return memberMapper.toDto(memberRepository.save(teacher));
    }

    @Override
    public void deleteTeacher(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy giáo viên với ID: " + id);
        }
        Member member = memberRepository.findByIdOrCode(id)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên với ID: " + id));

        memberRepository.delete(member);
    }

    @Override
    public MemberDto createStudent(MemberDto studentDto) {
        if (studentDto == null) {
            throw AppException.badRequest("Thông tin học sinh không được để trống!");
        }

        String studentCode = studentDto.getCode();
        if (studentCode == null || studentCode.trim().isEmpty()) {
            studentCode = getNextId("student");
        } else {
            studentCode = studentCode.trim().toUpperCase();
        }

        // Kiểm tra trùng lặp mã học sinh
        if (memberRepository.findByCode(studentCode).isPresent()) {
            throw AppException.badRequest("Mã học sinh " + studentCode + " đã tồn tại trong hệ thống!",
                    Map.of("code", "Mã học sinh đã tồn tại trong hệ thống."));
        }

        // Kiểm tra trùng lặp email
        String email = studentDto.getEmail();
        if (email != null && !email.trim().isEmpty()) {
            email = email.trim().toLowerCase();
            if (memberRepository.findByEmailIgnoreCase(email).isPresent()) {
                throw AppException.badRequest("Email " + email + " đã tồn tại trong hệ thống!",
                        Map.of("email", "Email đã tồn tại trong hệ thống."));
            }
        } else {
            email = studentCode.toLowerCase() + "@gmail.com";
        }

        // Xử lý className an toàn để không bị lỗi ràng buộc khóa ngoại (foreign key fk_member_class)
        String cls = studentDto.getClassName();
        if (cls == null || cls.trim().isEmpty() || "unassigned".equalsIgnoreCase(cls.trim()) || "none".equalsIgnoreCase(cls.trim())) {
            cls = null;
        } else {
            cls = classRepository.findByIdOrCode(cls.trim()).map(SchoolClass::getCode).orElse(null);
        }

        String name = studentDto.getName();
        if (name == null || name.trim().isEmpty()) {
            name = "Học sinh " + studentCode;
        } else {
            name = name.trim();
        }

        String rawPassword = (studentDto.getPassword() != null && !studentDto.getPassword().trim().isEmpty())
                ? studentDto.getPassword().trim()
                : PasswordGenerator.generatePassword();

        Member entity = Member.builder()
                .code(studentCode)
                .name(name)
                .email(email)
                .password(PasswordUtil.ensureSha1(rawPassword))
                .role("student")
                .className(cls)
                .mustChangePassword(false)
                .assignedClasses(new ArrayList<>())
                .build();

        Member saved = memberRepository.saveAndFlush(entity);

        // Khởi tạo bản ghi Grade cho học sinh mới để hiển thị đầy đủ trong bảng điểm
        if (saved.getId() != null) {
            String sCode = (saved.getCode() != null && !saved.getCode().trim().isEmpty())
                    ? saved.getCode().trim().toUpperCase()
                    : String.valueOf(saved.getId());
            boolean gradeExists = gradeRepository.findByStudentCodeIgnoreCase(sCode).isPresent()
                    || gradeRepository.findByStudentId(saved.getId()).isPresent();
            if (!gradeExists) {
                try {
                    Grade initialGrade = Grade.builder()
                            .studentId(sCode)
                            .studentCode(sCode)
                            .build();
                    gradeRepository.saveAndFlush(initialGrade);
                } catch (Exception e) {
                    log.warn("Không thể khởi tạo bản ghi điểm ban đầu cho học sinh {}: {}", saved.getCode(), e.getMessage());
                }
            }
        }

        return memberMapper.toDto(saved);
    }

    @Override
    public MemberDto updateStudent(String id, MemberDto studentDto) {
        Member student = memberRepository.findByIdOrCode(id)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh với ID: " + id));

        student.setName(studentDto.getName());
        student.setEmail(studentDto.getEmail());
        if (studentDto.getPassword() != null && !studentDto.getPassword().trim().isEmpty()) {
            student.setPassword(PasswordUtil.ensureSha1(studentDto.getPassword()));
        }
        String cls = studentDto.getClassName();
        if (cls == null || cls.trim().isEmpty()) {
            cls = null;
        }
        student.setClassName(cls);
        Member saved = memberRepository.save(student);

        if (cls == null && student.getId() != null) {
            gradeRepository.findByStudentId(student.getId()).ifPresent(grade -> {
                clearSubjectGrades(grade, "math");
                clearSubjectGrades(grade, "literature");
                clearSubjectGrades(grade, "english");
                grade.setGpa(null);
                gradeRepository.save(grade);
            });
        }

        return memberMapper.toDto(saved);
    }

    @Override
    public void deleteStudent(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy học sinh với ID: " + id);
        }
        Member student = memberRepository.findByIdOrCode(id)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh với ID: " + id));

        if (student.getId() != null) {
            gradeRepository.deleteByStudentId(student.getId());
            gradeRepository.flush();

            memberRepository.delete(student);
            memberRepository.flush();
        }
    }

    @Override
    public List<SchoolClassDto> getAllClasses() {
        Map<String, Integer> studentCounts = new HashMap<>();
        try {
            for (Object[] row : memberRepository.countStudentsPerClass()) {
                if (row[0] != null && row[1] != null) {
                    studentCounts.put(((String) row[0]).toUpperCase(), ((Number) row[1]).intValue());
                }
            }
        } catch (Exception ignored) {}

        Map<String, Integer> teacherCounts = new HashMap<>();
        try {
            for (Object[] row : memberRepository.countTeachersPerClass()) {
                if (row[0] != null && row[1] != null) {
                    teacherCounts.put(((String) row[0]).toUpperCase(), ((Number) row[1]).intValue());
                }
            }
        } catch (Exception ignored) {}

        return classRepository.findAll().stream()
                .map(c -> {
                    SchoolClassDto dto = classMapper.toDto(c);
                    if (dto != null && c.getCode() != null) {
                        String classCodeUpper = c.getCode().toUpperCase();
                        dto.setStudentCount(studentCounts.getOrDefault(classCodeUpper, 0));
                        dto.setTeacherCount(teacherCounts.getOrDefault(classCodeUpper, 0));
                    }
                    return dto;
                })
                .toList();
    }

    @Override
    public SchoolClassDto createClass(SchoolClassDto classDto) {
        if (classDto == null) {
            throw AppException.badRequest("Mã lớp không hợp lệ!");
        }
        String rawCode = classDto.getCode() != null ? classDto.getCode() : "";
        if (rawCode.trim().isEmpty()) {
            throw AppException.badRequest("Mã lớp không hợp lệ!");
        }
        String codeUpper = rawCode.trim().toUpperCase();
        if (classRepository.existsByCodeIgnoreCase(codeUpper)) {
            throw AppException.conflict("Mã lớp " + codeUpper + " đã tồn tại trong hệ thống!");
        }

        SchoolClass entity = classMapper.toEntity(classDto);
        entity.setId(null);
        entity.setCode(codeUpper);
        if (entity.getName() == null || entity.getName().trim().isEmpty()) {
            entity.setName("Lớp " + codeUpper);
        }

        SchoolClass saved = classRepository.save(entity);
        return classMapper.toDto(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteClass(String id) {
        SchoolClass schoolClass = classRepository.findByIdOrCode(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học với ID: " + id));

        String classCode = schoolClass.getCode();

        // Tối ưu thao tác khi xóa lớp học: Sử dụng Bulk Update ở tầng truy vấn,
        // trực tiếp làm sạch thông tin lớp của toàn bộ học sinh liên quan trong một thao tác duy nhất.
        if (classCode != null) {
            memberRepository.clearClassNameForClass(classCode);

            List<Member> teachers = memberRepository.findTeachersByClassId(classCode);
            for (Member t : teachers) {
                if (t.getAssignedClasses() != null) {
                    t.getAssignedClasses().remove(classCode);
                    memberRepository.save(t);
                }
            }
        }

        classRepository.delete(schoolClass);
    }

    @Override
    public MemberDto enrollStudent(String studentId, String className) {
        Member student = memberRepository.findByIdOrCode(studentId)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh với ID: " + studentId));

        String cls = className;
        if (cls == null || cls.trim().isEmpty()) {
            cls = null;
        }
        student.setClassName(cls);
        Member saved = memberRepository.save(student);

        if (cls == null && student.getId() != null) {
            gradeRepository.findByStudentId(student.getId()).ifPresent(grade -> {
                clearSubjectGrades(grade, "math");
                clearSubjectGrades(grade, "literature");
                clearSubjectGrades(grade, "english");
                grade.setGpa(null);
                gradeRepository.save(grade);
            });
        }

        return memberMapper.toDto(saved);
    }

    @Override
    public MemberDto enrollTeacherClass(String teacherId, String className) {
        Member teacher = memberRepository.findByIdOrCode(teacherId)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên với ID: " + teacherId));

        if (teacher.getAssignedClasses() == null) {
            teacher.setAssignedClasses(new ArrayList<>());
        }
        if (!teacher.getAssignedClasses().contains(className)) {
            teacher.getAssignedClasses().add(className);
        }
        return memberMapper.toDto(memberRepository.save(teacher));
    }

    @Override
    public MemberDto unenrollTeacherClass(String teacherId, String className) {
        Member teacher = memberRepository.findByIdOrCode(teacherId)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên với ID: " + teacherId));

        if (teacher.getAssignedClasses() != null) {
            teacher.getAssignedClasses().remove(className);
        }
        return memberMapper.toDto(memberRepository.save(teacher));
    }

    @Override
    public List<GradeDto> getAllGrades() {
        return gradeRepository.findAll().stream()
                .map(gradeMapper::toDto)
                .toList();
    }

    @Override
    public Object getGradesResponse(Integer page, Integer size, String search, String classes, String currentUserId, String scoreSubject, String scoreOp, Double scoreVal) {
        int p = (page != null && page > 0) ? page : 1;
        int s = (size != null && size > 0 && size <= 100) ? size : 10;
        Pageable pageable = PageRequest.of(p - 1, s);

        List<String> classList = (classes != null && !classes.trim().isEmpty())
                ? Arrays.asList(classes.split(","))
                : Collections.emptyList();

        String subject = getTeacherSubject(currentUserId);

        org.springframework.data.jpa.domain.Specification<Grade> spec = com.school.manager.specification.GradeSpecification.filterGrades(
                scoreSubject, scoreOp, scoreVal, subject, search, classList
        );

        Page<Grade> gradesPage = gradeRepository.findAll(spec, pageable);
        long totalElements = gradesPage.getTotalElements();
        int totalPages = gradesPage.getTotalPages();
        List<Map<String, Object>> content = new ArrayList<>();

        Map<String, Member> studentMap = new HashMap<>();
        memberRepository.findAll().forEach(m -> {
            if (m != null) {
                if (m.getId() != null) {
                    studentMap.put(String.valueOf(m.getId()), m);
                }
                if (m.getCode() != null) {
                    studentMap.put(m.getCode().trim().toLowerCase(), m);
                }
            }
        });

        for (Grade gEntity : gradesPage.getContent()) {
            if (gEntity == null) continue;
            String lookupKey = gEntity.getStudentCode() != null ? gEntity.getStudentCode().trim().toLowerCase() : (gEntity.getStudentId() != null ? gEntity.getStudentId().trim().toLowerCase() : "");
            Member sEntity = studentMap.get(lookupKey);
            if (sEntity == null && gEntity.getStudentId() != null) {
                sEntity = studentMap.get(gEntity.getStudentId().trim().toLowerCase());
            }
            if (sEntity == null) {
                String code = gEntity.getStudentCode() != null ? gEntity.getStudentCode() : (gEntity.getStudentId() != null ? gEntity.getStudentId() : "HS0");
                sEntity = Member.builder()
                        .code(code)
                        .name("Học sinh " + code)
                        .role("student")
                        .className("Chưa xếp lớp")
                        .build();
            }
            GradeDto gDto = gradeMapper.toDto(gEntity);
            if (gDto != null) {
                gDto.setStudentCode(sEntity.getCode());
                gDto.setStudentId(sEntity.getCode());
            }
            content.add(buildStudentGradeRecord(memberMapper.toDto(sEntity), gDto, subject));
        }

        if (totalElements == 0) {
            totalPages = 1;
        }

        return PageResponse.<Map<String, Object>>builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .page(p)
                .size(s)
                .build();
    }

    private String getTeacherSubject(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return null;
        }
        return memberRepository.findByIdOrCode(userId)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .map(Member::getSubject)
                .orElse(null);
    }

    private record SubjectScoreView(
            String name,
            Double avg,
            Double oral,
            Double m15,
            Double mid,
            Double finalScore
    ) {}

    private void populateSubjectScores(Map<String, Object> record, GradeDto grade, String subject) {
        if (grade == null) {
            return;
        }
        Double math = java.util.Optional.ofNullable(grade.getMath())
                .orElseGet(() -> ScoreUtil.calculateAverage(grade.getMath_oral(), grade.getMath_m15(), grade.getMath_mid(), grade.getMath_final()));
        Double literature = java.util.Optional.ofNullable(grade.getLiterature())
                .orElseGet(() -> ScoreUtil.calculateAverage(grade.getLiterature_oral(), grade.getLiterature_m15(), grade.getLiterature_mid(), grade.getLiterature_final()));
        Double english = java.util.Optional.ofNullable(grade.getEnglish())
                .orElseGet(() -> ScoreUtil.calculateAverage(grade.getEnglish_oral(), grade.getEnglish_m15(), grade.getEnglish_mid(), grade.getEnglish_final()));
        Double gpa = java.util.Optional.ofNullable(grade.getGpa())
                .orElseGet(() -> ScoreUtil.calculateGpa(math, literature, english));

        String cleanSubject = (subject != null) ? subject.trim().toLowerCase() : null;

        List<SubjectScoreView> subjects = List.of(
                new SubjectScoreView("math", math, grade.getMath_oral(), grade.getMath_m15(), grade.getMath_mid(), grade.getMath_final()),
                new SubjectScoreView("literature", literature, grade.getLiterature_oral(), grade.getLiterature_m15(), grade.getLiterature_mid(), grade.getLiterature_final()),
                new SubjectScoreView("english", english, grade.getEnglish_oral(), grade.getEnglish_m15(), grade.getEnglish_mid(), grade.getEnglish_final())
        );

        subjects.stream()
                .filter(s -> cleanSubject == null || cleanSubject.equals(s.name))
                .forEach(s -> {
                    record.put(s.name, s.avg);
                    record.put(s.name + "_oral", s.oral);
                    record.put(s.name + "_m15", s.m15);
                    record.put(s.name + "_mid", s.mid);
                    record.put(s.name + "_final", s.finalScore);
                    if (cleanSubject != null) {
                        record.put("gpa", s.avg);
                    }
                });

        if (cleanSubject == null) {
            record.put("gpa", gpa);
        }

        record.entrySet().removeIf(entry -> entry.getValue() == null);
    }

    private Map<String, Object> buildStudentGradeRecord(MemberDto student, GradeDto grade, String subject) {
        Map<String, Object> record = new LinkedHashMap<>();
        if (student != null) {
            record.put("id", student.getId());
            record.put("code", student.getCode());
            record.put("className", (student.getClassName() != null) ? student.getClassName() : "Chưa xếp lớp");
            record.put("studentId", student.getCode() != null ? student.getCode() : (student.getId() != null ? String.valueOf(student.getId()) : ""));
            record.put("studentCode", student.getCode());
            record.put("studentName", student.getName());
            record.put("email", student.getEmail());
            record.put("password", student.getPassword());
        }
        populateSubjectScores(record, grade, subject);
        return record;
    }

    private Map<String, Object> buildGradeRecordMap(GradeDto grade, String subject) {
        Map<String, Object> record = new LinkedHashMap<>();
        if (grade == null) {
            return record;
        }
        record.put("id", grade.getId());
        record.put("studentId", grade.getStudentCode() != null ? grade.getStudentCode() : (grade.getStudentId() != null ? grade.getStudentId() : ""));
        record.put("studentCode", grade.getStudentCode());
        populateSubjectScores(record, grade, subject);
        if (grade.getUpdatedBy() != null) {
            record.put("updatedBy", grade.getUpdatedBy());
        }
        return record;
    }

    @Override
    public Map<String, Object> getStudentGradeRecord(String studentId, String currentUserId) {
        if (studentId == null || studentId.trim().isEmpty()) {
            return Collections.emptyMap();
        }
        Member student = memberRepository.findByIdOrCode(studentId)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElse(null);

        GradeDto grade = null;
        if (student != null) {
            if (student.getId() != null) {
                grade = gradeRepository.findByStudentId(student.getId())
                        .map(gradeMapper::toDto)
                        .orElse(null);
            }
            if (grade == null && student.getCode() != null) {
                grade = gradeRepository.findByStudentIdOrCode(student.getCode())
                        .map(gradeMapper::toDto)
                        .orElse(null);
            }
        }
        if (grade == null) {
            grade = gradeRepository.findByStudentIdOrCode(studentId)
                    .map(gradeMapper::toDto)
                    .orElse(null);
        }
        if (grade == null) {
            grade = GradeDto.builder()
                    .studentId(student != null && student.getId() != null ? student.getId() : null)
                    .studentCode(student != null ? student.getCode() : studentId)
                    .build();
        }
        if (student != null && (grade.getStudentCode() == null || grade.getStudentCode().trim().isEmpty())) {
            grade.setStudentCode(student.getCode());
        }

        String subject = getTeacherSubject(currentUserId);
        return buildGradeRecordMap(grade, subject);
    }

    private void applySubjectGradeUpdate(
            Consumer<Double> setOral, Consumer<Double> setM15,
            Consumer<Double> setMid, Consumer<Double> setFinal,
            Consumer<Double> setAvg,
            Double oral, Double m15, Double mid, Double finalScore, Double avg
    ) {
        setOral.accept(oral);
        setM15.accept(m15);
        setMid.accept(mid);
        setFinal.accept(finalScore);
        if (oral == null && m15 == null && mid == null && finalScore == null) {
            setAvg.accept(avg);
        }
    }

    private void clearGradeFields(Consumer<Double> setOral, Consumer<Double> setM15,
                                  Consumer<Double> setMid, Consumer<Double> setFinal,
                                  Consumer<Double> setAvg) {
        setOral.accept(null);
        setM15.accept(null);
        setMid.accept(null);
        setFinal.accept(null);
        setAvg.accept(null);
    }

    private void updateSubjectGrades(Grade grade, GradeDto gradeDto, String subject) {
        if (grade == null || gradeDto == null || subject == null) {
            return;
        }
        switch (subject.trim().toLowerCase()) {
            case "math" -> applySubjectGradeUpdate(
                    grade::setMath_oral, grade::setMath_m15, grade::setMath_mid, grade::setMath_final, grade::setMath,
                    gradeDto.getMath_oral(), gradeDto.getMath_m15(), gradeDto.getMath_mid(), gradeDto.getMath_final(), gradeDto.getMath()
            );
            case "literature" -> applySubjectGradeUpdate(
                    grade::setLiterature_oral, grade::setLiterature_m15, grade::setLiterature_mid, grade::setLiterature_final, grade::setLiterature,
                    gradeDto.getLiterature_oral(), gradeDto.getLiterature_m15(), gradeDto.getLiterature_mid(), gradeDto.getLiterature_final(), gradeDto.getLiterature()
            );
            case "english" -> applySubjectGradeUpdate(
                    grade::setEnglish_oral, grade::setEnglish_m15, grade::setEnglish_mid, grade::setEnglish_final, grade::setEnglish,
                    gradeDto.getEnglish_oral(), gradeDto.getEnglish_m15(), gradeDto.getEnglish_mid(), gradeDto.getEnglish_final(), gradeDto.getEnglish()
            );
            default -> {}
        }
    }

    private void clearSubjectGrades(Grade grade, String subject) {
        if (grade == null || subject == null) {
            return;
        }
        switch (subject.trim().toLowerCase()) {
            case "math" -> clearGradeFields(grade::setMath_oral, grade::setMath_m15, grade::setMath_mid, grade::setMath_final, grade::setMath);
            case "literature" -> clearGradeFields(grade::setLiterature_oral, grade::setLiterature_m15, grade::setLiterature_mid, grade::setLiterature_final, grade::setLiterature);
            case "english" -> clearGradeFields(grade::setEnglish_oral, grade::setEnglish_m15, grade::setEnglish_mid, grade::setEnglish_final, grade::setEnglish);
            default -> {}
        }
    }

    @Override
    public GradeDto saveGrade(String studentId, GradeDto gradeDto) {
        if (studentId == null || studentId.trim().isEmpty()) {
            throw AppException.badRequest("Mã học sinh không được để trống!");
        }
        Member student = memberRepository.findByIdOrCode(studentId)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh với ID: " + studentId));

        Long studentIdLong = student.getId();
        Grade grade = gradeRepository.findByStudentId(studentIdLong)
                .orElseGet(() -> Grade.builder().studentId(studentIdLong).studentCode(student.getCode()).build());
        grade.setStudentCode(student.getCode());

        final GradeDto effectiveDto = (gradeDto != null) ? gradeDto : new GradeDto();

        String subject = getTeacherSubject(effectiveDto.getUpdatedBy());

        List<String> targetSubjects = (subject != null)
                ? List.of(subject)
                : List.of("math", "literature", "english");
        targetSubjects.forEach(s -> updateSubjectGrades(grade, effectiveDto, s));

        grade.calculateDerivedScores();
        Grade saved = gradeRepository.save(grade);
        GradeDto resultDto = gradeMapper.toDto(saved);
        if (resultDto != null) {
            resultDto.setStudentCode(student.getCode());
        }
        return resultDto;
    }

    @Override
    public Map<String, Object> saveGradeRecord(String studentId, GradeDto gradeDto) {
        GradeDto saved = saveGrade(studentId, gradeDto);
        String subject = getTeacherSubject(gradeDto != null ? gradeDto.getUpdatedBy() : null);
        return buildGradeRecordMap(saved, subject);
    }

    @Override
    public void deleteGrade(String studentId) {
        if (studentId == null || studentId.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy bảng điểm!");
        }
        Member student = memberRepository.findByIdOrCode(studentId)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh: " + studentId));

        if (student.getId() != null) {
            gradeRepository.deleteByStudentId(student.getId());
            gradeRepository.flush();
        }
    }

    @Override
    public void deleteSubjectGrade(String studentId, String subject) {
        if (studentId == null || studentId.trim().isEmpty()) {
            return;
        }
        Member student = memberRepository.findByIdOrCode(studentId)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .orElse(null);

        if (student != null && student.getId() != null) {
            gradeRepository.findByStudentId(student.getId()).ifPresent(grade -> {
                clearSubjectGrades(grade, subject);
                grade.calculateDerivedScores();
                gradeRepository.save(grade);
            });
        }
    }

    @Override
    public List<GradeDto> getExcellentMathStudents(Double minScore) {
        return gradeRepository.findExcellentMathStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .toList();
    }

    @Override
    public List<GradeDto> getExcellentLiteratureStudents(Double minScore) {
        return gradeRepository.findExcellentLiteratureStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .toList();
    }

    @Override
    public List<GradeDto> getExcellentEnglishStudents(Double minScore) {
        return gradeRepository.findExcellentEnglishStudents(minScore).stream()
                .map(gradeMapper::toDto)
                .toList();
    }

    @Override
    public List<GradeDto> getStudentsWithCompleteGrades() {
        return gradeRepository.findStudentsWithCompleteGrades().stream()
                .map(gradeMapper::toDto)
                .toList();
    }

    @Override
    public List<MemberDto> getMembersByRole(String role) {
        return memberRepository.findByRole(role).stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public List<MemberDto> getMembersByRoleAndClassName(String role, String className) {
        return memberRepository.findByRoleAndClassName(role, className).stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public List<MemberDto> getMembersByRoleAndSubject(String role, String subject) {
        return memberRepository.findByRoleAndSubject(role, subject).stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public List<MemberDto> getTeachersByClassId(String classId) {
        return memberRepository.findTeachersByClassId(classId).stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public List<MemberDto> searchMembersByName(String keyword) {
        return memberRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(memberMapper::toDto)
                .toList();
    }

    @Override
    public MemberDto getMemberById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy thành viên!");
        }
        return memberRepository.findByIdOrCode(id)
                .map(memberMapper::toDto)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy thành viên với ID: " + id));
    }

    @Override
    public MemberDto getTeacherById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy giáo viên!");
        }
        return memberRepository.findByIdOrCode(id)
                .filter(m -> "teacher".equalsIgnoreCase(m.getRole()))
                .map(memberMapper::toDto)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên với ID: " + id));
    }

    @Override
    public MemberDto getStudentById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy học sinh!");
        }
        return memberRepository.findByIdOrCode(id)
                .filter(m -> "student".equalsIgnoreCase(m.getRole()))
                .map(memberMapper::toDto)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy học sinh với ID: " + id));
    }

    @Override
    public SchoolClassDto getClassById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw AppException.notFound("Không tìm thấy lớp học!");
        }
        return classRepository.findByIdOrCode(id)
                .map(classMapper::toDto)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học với ID: " + id));
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

    @Override
    public List<MemberDto> autoAssignTeachers() {
        List<SchoolClass> classes = classRepository.findAll();
        List<Member> teachers = memberRepository.findByRole("teacher");

        if (classes.isEmpty() || teachers.isEmpty()) {
            return getAllMembers();
        }

        String[] subjects = {"math", "literature", "english"};

        for (String subject : subjects) {
            List<Member> subjectTeachers = teachers.stream()
                    .filter(t -> subject.equalsIgnoreCase(t.getSubject()))
                    .toList();

            if (subjectTeachers.isEmpty()) {
                continue;
            }

            List<SchoolClass> missingClasses = new ArrayList<>(findClassesMissingSubjectTeacher(classes, teachers, subject));
            Collections.shuffle(missingClasses);

            for (SchoolClass c : missingClasses) {
                if (hasClassSubjectTeacher(teachers, c.getCode(), subject)) {
                    continue;
                }
                selectBestCandidateTeacher(subjectTeachers, c.getCode())
                        .ifPresent(teacher -> assignClassToTeacher(teacher, c.getCode()));
            }
        }

        memberRepository.saveAll(teachers);
        return getAllMembers();
    }

    private boolean hasClassSubjectTeacher(List<Member> teachers, String classCode, String subject) {
        return teachers.stream().anyMatch(t ->
                subject.equalsIgnoreCase(t.getSubject())
                        && t.getAssignedClasses() != null
                        && t.getAssignedClasses().contains(classCode)
        );
    }

    private List<SchoolClass> findClassesMissingSubjectTeacher(List<SchoolClass> classes, List<Member> teachers, String subject) {
        return classes.stream()
                .filter(c -> !hasClassSubjectTeacher(teachers, c.getCode(), subject))
                .toList();
    }

    private Optional<Member> selectBestCandidateTeacher(List<Member> subjectTeachers, String classCode) {
        List<Member> availableTeachers = subjectTeachers.stream()
                .filter(t -> t.getAssignedClasses() == null || !t.getAssignedClasses().contains(classCode))
                .toList();

        if (availableTeachers.isEmpty()) {
            return Optional.empty();
        }

        List<Member> underLimit = availableTeachers.stream()
                .filter(t -> (t.getAssignedClasses() == null ? 0 : t.getAssignedClasses().size()) < 2)
                .toList();

        List<Member> pool = !underLimit.isEmpty() ? underLimit : availableTeachers;

        int minClasses = pool.stream()
                .mapToInt(t -> t.getAssignedClasses() != null ? t.getAssignedClasses().size() : 0)
                .min()
                .orElse(0);

        List<Member> candidates = new ArrayList<>(pool.stream()
                .filter(t -> (t.getAssignedClasses() == null ? 0 : t.getAssignedClasses().size()) == minClasses)
                .toList());

        Collections.shuffle(candidates);
        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.getFirst());
    }

    private void assignClassToTeacher(Member teacher, String classCode) {
        if (teacher.getAssignedClasses() == null) {
            teacher.setAssignedClasses(new ArrayList<>());
        }
        teacher.getAssignedClasses().add(classCode);
    }

    @Override
    public MemberDto autoAssignSingleTeacher(String teacherId) {
        Member teacher = memberRepository.findByIdOrCode(teacherId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giáo viên."));

        if (!"teacher".equalsIgnoreCase(teacher.getRole())) {
            throw AppException.badRequest("Thành viên không phải là giáo viên.");
        }

        String subject = teacher.getSubject();
        if (subject == null || subject.trim().isEmpty()) {
            throw AppException.badRequest("Giáo viên chưa được chỉ định môn giảng dạy.");
        }

        List<SchoolClass> classes = classRepository.findAll();
        List<Member> allTeachers = memberRepository.findByRole("teacher");

        if (teacher.getAssignedClasses() == null) {
            teacher.setAssignedClasses(new ArrayList<>());
        }

        List<SchoolClass> missingClasses = new ArrayList<>(classes.stream()
                .filter(c -> !hasClassSubjectTeacher(allTeachers, c.getCode(), subject)
                        && !teacher.getAssignedClasses().contains(c.getCode()))
                .toList());

        Collections.shuffle(missingClasses);

        for (SchoolClass c : missingClasses) {
            if (teacher.getAssignedClasses().size() >= 2) {
                break;
            }
            teacher.getAssignedClasses().add(c.getCode());
        }

        memberRepository.save(teacher);
        return memberMapper.toDto(teacher);
    }
}
