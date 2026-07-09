package com.school.manager;

import com.school.manager.dto.*;
import com.school.manager.entity.*;
import com.school.manager.repository.*;
import com.school.manager.service.SchoolService;
import com.school.manager.config.DatabaseSeeder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@AutoConfigureMockMvc
class SchoolManagerApplicationTests {

    @Autowired
    private SchoolService schoolService;

    @Autowired
    private SchoolClassRepository classRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private org.springframework.context.ApplicationContext context;

    @BeforeEach
    void setUp() {
        gradeRepository.deleteAll();
        memberRepository.deleteAll();
        classRepository.deleteAll();

        SchoolClass class10A1 = SchoolClass.builder().id("10A1").name("Lớp 10A1").build();
        classRepository.save(class10A1);

        Member admin = Member.builder()
                .id("AD001")
                .name("Quản trị viên")
                .email("admin@gmail.com")
                .password("admin123")
                .role("admin")
                .build();
        memberRepository.save(admin);

        Member student = Member.builder()
                .id("HS001")
                .name("Nguyễn Văn A")
                .email("hs01@gmail.com")
                .password("student123")
                .role("student")
                .className("10A1")
                .build();
        memberRepository.save(student);

        Member studentNoClass = Member.builder()
                .id("HS002")
                .name("Trần Thị B")
                .email("hs02@gmail.com")
                .password("student123")
                .role("student")
                .className(null)
                .build();
        memberRepository.save(studentNoClass);

        Member studentPartial = Member.builder()
                .id("HS003")
                .name("Lê Văn C")
                .email("hs03@gmail.com")
                .password("student123")
                .role("student")
                .className("10A1")
                .build();
        memberRepository.save(studentPartial);

        Member teacher = Member.builder()
                .id("GV01")
                .name("Nguyễn Văn Hùng")
                .email("gv01@edu.com")
                .password("teacher123")
                .role("teacher")
                .subject("math")
                .assignedClasses(new ArrayList<>(List.of("10A1")))
                .build();
        memberRepository.save(teacher);

        Grade grade = Grade.builder()
                .studentId("HS001")
                .math(8.5)
                .literature(9.0)
                .english(7.0)
                .build();
        gradeRepository.save(grade);

        Grade partialGrade = Grade.builder()
                .studentId("HS003")
                .math(9.5)
                .build();
        gradeRepository.save(partialGrade);
    }

    @Test
    void contextLoads() {
        assertNotNull(schoolService, "SchoolService phải được tiêm (inject) thành công.");
    }

    @Test
    void testInitialDataSeeded() {
        List<SchoolClassDto> classes = schoolService.getAllClasses();
        assertFalse(classes.isEmpty(), "Danh sách lớp học phải được nạp vào CSDL.");
        assertTrue(classes.stream().anyMatch(c -> c.getId().equals("10A1")), "Lớp 10A1 phải tồn tại.");

        List<MemberDto> members = schoolService.getAllMembers();
        assertFalse(members.isEmpty(), "Danh sách thành viên phải được nạp vào CSDL.");
        assertTrue(members.stream().anyMatch(m -> m.getEmail().equals("admin@gmail.com")), "Quản trị viên phải tồn tại.");
    }

    @Test
    void testLoginSuccess() {
        LoginRequestDto credentials = new LoginRequestDto("admin@gmail.com", "admin123");
        MemberDto result = schoolService.login(credentials);

        assertNotNull(result);
        assertEquals("Quản trị viên", result.getName());
        assertEquals("admin", result.getRole());
    }

    @Test
    void testLoginFailure() {
        LoginRequestDto badCredentials = new LoginRequestDto("admin@gmail.com", "wrongpassword");
        assertThrows(RuntimeException.class, () -> schoolService.login(badCredentials),
                "Phải ném ra ngoại lệ khi thông tin đăng nhập không hợp lệ.");
    }

    @Test
    void testLoginNullCredentials() {
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(null));
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(new LoginRequestDto(null, "pass")));
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(new LoginRequestDto("email", null)));
    }

    @Test
    void testTeacherManagement() {
        MemberDto teacherDto = MemberDto.builder()
                .name("New Teacher")
                .email("new.teacher@gmail.com")
                .password("teacher123")
                .subject("math")
                .build();

        MemberDto created = schoolService.createTeacher(teacherDto);
        assertNotNull(created.getId());
        assertEquals("teacher", created.getRole());
        assertEquals("math", created.getSubject());
        assertNotNull(created.getAssignedClasses());

        created.setName("Updated Teacher Name");
        created.setSubject("literature");
        created.setAssignedClasses(List.of("10A1"));
        MemberDto updated = schoolService.updateTeacher(created.getId(), created);
        assertEquals("Updated Teacher Name", updated.getName());
        assertEquals("literature", updated.getSubject());
        assertTrue(updated.getAssignedClasses().contains("10A1"));

        schoolService.deleteTeacher(created.getId());

        assertThrows(RuntimeException.class, () -> schoolService.updateTeacher("NON_EXIST_ID", created));
        assertThrows(RuntimeException.class, () -> schoolService.deleteTeacher("NON_EXIST_ID"));
    }

    @Test
    void testStudentManagement() {
        MemberDto studentDto = MemberDto.builder()
                .name("New Student")
                .email("new.student@gmail.com")
                .password("student123")
                .build();

        MemberDto created = schoolService.createStudent(studentDto);
        assertNotNull(created.getId());
        assertEquals("student", created.getRole());

        created.setName("Updated Student Name");
        created.setClassName("10A1");
        MemberDto updated = schoolService.updateStudent(created.getId(), created);
        assertEquals("Updated Student Name", updated.getName());
        assertEquals("10A1", updated.getClassName());

        schoolService.deleteStudent(created.getId());

        assertThrows(RuntimeException.class, () -> schoolService.updateStudent("NON_EXIST_ID", created));
        assertThrows(RuntimeException.class, () -> schoolService.deleteStudent("NON_EXIST_ID"));
    }

    @Test
    void testClassManagement() {
        SchoolClassDto newClass = new SchoolClassDto();
        newClass.setId("9A1");
        newClass.setName("Lớp 9A1");

        SchoolClassDto created = schoolService.createClass(newClass);
        assertEquals("9A1", created.getId());
        assertEquals("Lớp 9A1", created.getName());

        assertThrows(RuntimeException.class, () -> schoolService.createClass(newClass));

        SchoolClassDto invalidClass = new SchoolClassDto();
        assertThrows(IllegalArgumentException.class, () -> schoolService.createClass(invalidClass));

        schoolService.deleteClass("9A1");

        assertThrows(RuntimeException.class, () -> schoolService.deleteClass("NON_EXIST_CLASS"));
    }

    @Test
    void testEnrollments() {
        MemberDto studentDto = schoolService.createStudent(MemberDto.builder()
                .name("Enrollment Student")
                .email("enroll.stud@gmail.com")
                .password("pass")
                .build());

        MemberDto teacherDto = schoolService.createTeacher(MemberDto.builder()
                .name("Enrollment Teacher")
                .email("enroll.teach@gmail.com")
                .password("pass")
                .build());

        MemberDto enrolledStudent = schoolService.enrollStudent(studentDto.getId(), "10A1");
        assertEquals("10A1", enrolledStudent.getClassName());

        MemberDto enrolledTeacher = schoolService.enrollTeacherClass(teacherDto.getId(), "10A1");
        assertTrue(enrolledTeacher.getAssignedClasses().contains("10A1"));

        MemberDto enrolledTeacher2 = schoolService.enrollTeacherClass(teacherDto.getId(), "10A1");
        assertEquals(1, enrolledTeacher2.getAssignedClasses().stream().filter(c -> c.equals("10A1")).count());

        MemberDto unenrolledTeacher = schoolService.unenrollTeacherClass(teacherDto.getId(), "10A1");
        assertFalse(unenrolledTeacher.getAssignedClasses().contains("10A1"));

        assertThrows(RuntimeException.class, () -> schoolService.enrollStudent("NON_EXIST", "10A1"));
        assertThrows(RuntimeException.class, () -> schoolService.enrollTeacherClass("NON_EXIST", "10A1"));
        assertThrows(RuntimeException.class, () -> schoolService.unenrollTeacherClass("NON_EXIST", "10A1"));
    }

    @Test
    void testGradesManagementAndQueries() {
        GradeDto gradeDto = GradeDto.builder()
                .math(8.5)
                .literature(9.0)
                .english(7.0)
                .build();

        GradeDto saved = schoolService.saveGrade("HS001", gradeDto);
        assertEquals(8.5, saved.getMath());
        assertEquals(9.0, saved.getLiterature());
        assertEquals(7.0, saved.getEnglish());

        List<GradeDto> allGrades = schoolService.getAllGrades();
        assertFalse(allGrades.isEmpty());
        assertTrue(allGrades.stream().anyMatch(g -> g.getStudentId().equals("HS001")));

        List<GradeDto> excellentMath = schoolService.getExcellentMathStudents(8.0);
        assertTrue(excellentMath.stream().anyMatch(g -> g.getStudentId().equals("HS001")));

        List<GradeDto> excellentLiterature = schoolService.getExcellentLiteratureStudents(8.0);
        assertTrue(excellentLiterature.stream().anyMatch(g -> g.getStudentId().equals("HS001")));

        List<GradeDto> excellentEnglish = schoolService.getExcellentEnglishStudents(6.5);
        assertTrue(excellentEnglish.stream().anyMatch(g -> g.getStudentId().equals("HS001")));

        List<GradeDto> completeGrades = schoolService.getStudentsWithCompleteGrades();
        assertTrue(completeGrades.stream().anyMatch(g -> g.getStudentId().equals("HS001")));

        schoolService.deleteSubjectGrade("HS001", "math");
        List<GradeDto> checkGrades = schoolService.getAllGrades();
        GradeDto checkGrade = checkGrades.stream().filter(g -> g.getStudentId().equals("HS001")).findFirst().orElse(null);
        assertNotNull(checkGrade);
        assertNull(checkGrade.getMath());

        schoolService.deleteGrade("HS001");
        assertThrows(RuntimeException.class, () -> schoolService.deleteGrade("HS001"));
    }

    @Test
    void testMemberAndClassQueries() {
        List<MemberDto> students = schoolService.getMembersByRole("student");
        assertFalse(students.isEmpty());
        assertTrue(students.stream().allMatch(s -> "student".equals(s.getRole())));

        List<MemberDto> classStudents = schoolService.getMembersByRoleAndClassName("student", "10A1");
        assertFalse(classStudents.isEmpty());

        List<MemberDto> mathTeachers = schoolService.getMembersByRoleAndSubject("teacher", "math");
        assertFalse(mathTeachers.isEmpty());

        List<MemberDto> classTeachers = schoolService.getTeachersByClassId("10A1");
        assertNotNull(classTeachers);

        List<MemberDto> searched = schoolService.searchMembersByName("Nguyễn");
        assertFalse(searched.isEmpty());

        SchoolClassDto classByName = schoolService.getClassByName("Lớp 10A1");
        assertNotNull(classByName);
        assertEquals("10A1", classByName.getId());

        assertTrue(schoolService.existsClassByName("Lớp 10A1"));
        assertFalse(schoolService.existsClassByName("Non Existent Class Name"));
    }

    @Test
    void testDatabaseSeeder() throws Exception {
        DatabaseSeeder.DbData dbData = new DatabaseSeeder.DbData();
        dbData.setClasses(new ArrayList<>());
        dbData.setMembers(new ArrayList<>());
        dbData.setGrades(new ArrayList<>());
        assertNotNull(dbData.getClasses());
        assertNotNull(dbData.getMembers());
        assertNotNull(dbData.getGrades());

        DatabaseSeeder.DbData dbDataAll = new DatabaseSeeder.DbData(new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
        assertNotNull(dbDataAll);

        entityManager.clear();

        CommandLineRunner runner = (CommandLineRunner) context.getBean("initDatabase");
        assertNotNull(runner);
        runner.run("test-arg");
    }

    @Test
    void testMain() {
        SchoolManagerApplication.main(new String[]{
                "--server.port=0",
                "--spring.datasource.url=jdbc:h2:mem:school_db_test_main;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "--spring.datasource.driver-class-name=org.h2.Driver",
                "--spring.datasource.username=sa",
                "--spring.datasource.password=",
                "--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "--spring.jpa.hibernate.ddl-auto=create-drop"
        });
    }

    @Test
    void testControllerLoginSuccess() throws Exception {
        LoginRequestDto req = new LoginRequestDto("admin@gmail.com", "admin123");
        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@gmail.com"))
                .andExpect(jsonPath("$.role").value("admin"));
    }

    @Test
    void testControllerLoginFailure() throws Exception {
        LoginRequestDto req = new LoginRequestDto("admin@gmail.com", "wrong");
        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testControllerGetAllMembers() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testControllerTeacherCrud() throws Exception {
        MemberDto teacher = MemberDto.builder()
                .name("Test Controller Teacher")
                .email("tc.teacher@gmail.com")
                .password("pass")
                .subject("math")
                .build();

        String responseStr = mockMvc.perform(post("/api/teachers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Controller Teacher"))
                .andReturn().getResponse().getContentAsString();

        MemberDto created = objectMapper.readValue(responseStr, MemberDto.class);

        created.setName("Updated tc Teacher");
        mockMvc.perform(put("/api/teachers/" + created.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated tc Teacher"));

        mockMvc.perform(delete("/api/teachers/" + created.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/teachers/NON_EXIST")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/teachers/NON_EXIST"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testControllerStudentCrud() throws Exception {
        MemberDto student = MemberDto.builder()
                .name("Test Controller Student")
                .email("tc.student@gmail.com")
                .password("pass")
                .build();

        String responseStr = mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Controller Student"))
                .andReturn().getResponse().getContentAsString();

        MemberDto created = objectMapper.readValue(responseStr, MemberDto.class);

        created.setName("Updated tc Student");
        mockMvc.perform(put("/api/students/" + created.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated tc Student"));

        mockMvc.perform(delete("/api/students/" + created.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/students/NON_EXIST")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/students/NON_EXIST"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testControllerClassesCrud() throws Exception {
        mockMvc.perform(get("/api/classes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        SchoolClassDto newClass = new SchoolClassDto("11B2", "Lớp 11B2");

        mockMvc.perform(post("/api/classes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newClass)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("11B2"));

        mockMvc.perform(post("/api/classes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newClass)))
                .andExpect(status().isConflict());

        SchoolClassDto invalidClass = new SchoolClassDto();
        mockMvc.perform(post("/api/classes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidClass)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/classes/11B2"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/classes/NON_EXIST_CLASS"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testControllerEnrollments() throws Exception {
        Map<String, String> enrollStudentPayload = new HashMap<>();
        enrollStudentPayload.put("id", "HS001");
        enrollStudentPayload.put("className", "10A1");

        mockMvc.perform(post("/api/enroll/student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollStudentPayload)))
                .andExpect(status().isOk());

        Map<String, String> enrollStudentPayloadFail = new HashMap<>();
        enrollStudentPayloadFail.put("id", "NON_EXIST");
        enrollStudentPayloadFail.put("className", "10A1");
        mockMvc.perform(post("/api/enroll/student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollStudentPayloadFail)))
                .andExpect(status().isNotFound());

        Map<String, String> enrollTeacherPayload = new HashMap<>();
        enrollTeacherPayload.put("id", "GV01");
        enrollTeacherPayload.put("className", "10A1");

        mockMvc.perform(post("/api/enroll/teacher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollTeacherPayload)))
                .andExpect(status().isOk());

        Map<String, String> enrollTeacherPayloadFail = new HashMap<>();
        enrollTeacherPayloadFail.put("id", "NON_EXIST");
        enrollTeacherPayloadFail.put("className", "10A1");
        mockMvc.perform(post("/api/enroll/teacher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollTeacherPayloadFail)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/unenroll/teacher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollTeacherPayload)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/unenroll/teacher")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollTeacherPayloadFail)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testControllerGradesAndQueries() throws Exception {
        mockMvc.perform(get("/api/grades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        GradeDto gradeDto = GradeDto.builder()
                .math(9.0)
                .literature(9.5)
                .english(8.0)
                .build();

        mockMvc.perform(put("/api/grades/HS001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gradeDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.math").value(9.0));

        mockMvc.perform(get("/api/queries/grades/excellent/math").param("minScore", "8.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/grades/excellent/literature").param("minScore", "8.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/grades/excellent/english").param("minScore", "8.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/grades/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(delete("/api/grades/HS001/subject/math"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/grades/HS001"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/grades/HS001"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testControllerGetAllMembersComplexFiltersAndPagination() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/members").param("role", "student"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/members").param("role", "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/members").param("search", "hs001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Nguyễn Văn A"));

        mockMvc.perform(get("/api/members").param("search", "Trần"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("HS002"));

        mockMvc.perform(get("/api/members").param("search", "gv01@edu.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("GV01"));

        mockMvc.perform(get("/api/members").param("search", "non_existent_search_query"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/members")
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber());

        mockMvc.perform(get("/api/members")
                        .param("page", "99")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.page").value(99))
                .andExpect(jsonPath("$.size").value(10));

        mockMvc.perform(get("/api/members")
                        .param("role", "student")
                        .param("search", "Nguyễn")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("HS001"));

        mockMvc.perform(get("/api/members")
                        .param("role", "non_existent_role")
                        .param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void testControllerGetAllTeachersWithPaginationAndSearch() throws Exception {
        mockMvc.perform(get("/api/teachers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/teachers").param("search", "Hùng"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("GV01"));

        mockMvc.perform(get("/api/teachers").param("search", "gv01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("GV01"));

        mockMvc.perform(get("/api/teachers").param("search", "GV01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("GV01"));

        mockMvc.perform(get("/api/teachers")
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").value(1));

        mockMvc.perform(get("/api/teachers")
                        .param("page", "5")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());

        mockMvc.perform(get("/api/teachers")
                        .param("search", "completely_non_existent_teacher")
                        .param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void testControllerGetAllGradesWithPaginationAndSearch() throws Exception {
        mockMvc.perform(get("/api/grades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(1));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "HS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].studentName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.content[0].className").value("10A1"))
                .andExpect(jsonPath("$.content[0].math").value(8.5))
                .andExpect(jsonPath("$.content[0].literature").value(9.0))
                .andExpect(jsonPath("$.content[0].english").value(7.0))
                .andExpect(jsonPath("$.content[0].gpa").value(8.17));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "HS002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].studentName").value("Trần Thị B"))
                .andExpect(jsonPath("$.content[0].className").value("Chưa xếp lớp"))
                .andExpect(jsonPath("$.content[0].gpa").isEmpty());

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "HS003"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].studentName").value("Lê Văn C"))
                .andExpect(jsonPath("$.content[0].gpa").value(9.5));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "hs001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS001"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "Trần Thị"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS002"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "10A1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "Chưa xếp lớp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS002"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "8.17"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS001"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "9.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS003"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "9.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS001"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "7.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value("HS001"));

        mockMvc.perform(get("/api/grades").param("page", "1").param("search", "completely_unmatched_value"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(1));

        mockMvc.perform(get("/api/grades").param("page", "10").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void testControllerQueries() throws Exception {
        mockMvc.perform(get("/api/queries/members/role/student"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/members/role/student/class/10A1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/members/role/teacher/subject/math"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/members/teachers/class/10A1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/members/search").param("keyword", "Nguyễn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/queries/classes/by-name/Lớp 10A1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("10A1"));

        mockMvc.perform(get("/api/queries/classes/by-name/NonExist"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/queries/classes/exists/Lớp 10A1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true));
    }

    @Test
    void testMappersNullAndEdgeCases() {
        com.school.manager.mapper.GradeMapper gradeMapper = context.getBean(com.school.manager.mapper.GradeMapper.class);
        com.school.manager.mapper.MemberMapper memberMapper = context.getBean(com.school.manager.mapper.MemberMapper.class);
        com.school.manager.mapper.SchoolClassMapper classMapper = context.getBean(com.school.manager.mapper.SchoolClassMapper.class);

        assertNull(gradeMapper.toDto(null));
        assertNull(gradeMapper.toEntity(null));

        assertNull(memberMapper.toDto(null));
        assertNull(memberMapper.toEntity(null));

        assertNull(classMapper.toDto(null));
        assertNull(classMapper.toEntity(null));

        Member memberNullClasses = Member.builder()
                .assignedClasses(null)
                .build();
        assertNotNull(memberMapper.toDto(memberNullClasses).getAssignedClasses());
        assertTrue(memberMapper.toDto(memberNullClasses).getAssignedClasses().isEmpty());

        MemberDto memberDtoNullClasses = MemberDto.builder()
                .assignedClasses(null)
                .build();
        assertNotNull(memberMapper.toEntity(memberDtoNullClasses).getAssignedClasses());
        assertTrue(memberMapper.toEntity(memberDtoNullClasses).getAssignedClasses().isEmpty());
    }

    @Test
    void testEntitiesAndCoverage() {
        Grade g1 = Grade.builder().studentId("HS1").math(8.0).literature(7.0).english(6.0).build();
        Grade g2 = Grade.builder().studentId("HS1").math(8.0).literature(7.0).english(6.0).build();
        Grade g3 = Grade.builder().studentId("HS2").build();

        assertEquals(g1, g2);
        assertNotEquals(g1, g3);
        assertEquals(g1.hashCode(), g2.hashCode());
        assertNotNull(g1.toString());
        assertEquals("HS1", g1.getId());
        assertTrue(g1.isNew());
        g1.markNotNew();
        assertFalse(g1.isNew());

        Member m1 = Member.builder().id("M1").name("Name").email("e").password("p").role("student").className("C").subject("S").assignedClasses(new ArrayList<>()).build();
        Member m2 = Member.builder().id("M1").name("Name").email("e").password("p").role("student").className("C").subject("S").assignedClasses(new ArrayList<>()).build();
        Member m3 = Member.builder().id("M2").build();

        assertEquals(m1, m2);
        assertNotEquals(m1, m3);
        assertEquals(m1.hashCode(), m2.hashCode());
        assertNotNull(m1.toString());
        assertTrue(m1.isNew());
        m1.markNotNew();
        assertFalse(m1.isNew());

        SchoolClass sc1 = SchoolClass.builder().id("C1").name("Class").build();
        SchoolClass sc2 = SchoolClass.builder().id("C1").name("Class").build();
        SchoolClass sc3 = SchoolClass.builder().id("C2").build();

        assertEquals(sc1, sc2);
        assertNotEquals(sc1, sc3);
        assertEquals(sc1.hashCode(), sc2.hashCode());
        assertNotNull(sc1.toString());
        assertTrue(sc1.isNew());
        sc1.markNotNew();
        assertFalse(sc1.isNew());

        com.school.manager.entity.MemberAssignedClass mac1 = new com.school.manager.entity.MemberAssignedClass("M1", "C1");
        com.school.manager.entity.MemberAssignedClass mac2 = new com.school.manager.entity.MemberAssignedClass("M1", "C1");
        com.school.manager.entity.MemberAssignedClass mac3 = new com.school.manager.entity.MemberAssignedClass("M2", "C2");

        assertEquals(mac1, mac2);
        assertNotEquals(mac1, mac3);
        assertEquals(mac1.hashCode(), mac2.hashCode());
        assertNotNull(mac1.toString());

        com.school.manager.entity.MemberAssignedClass.IdClass idc1 = new com.school.manager.entity.MemberAssignedClass.IdClass("M1", "C1");
        com.school.manager.entity.MemberAssignedClass.IdClass idc2 = new com.school.manager.entity.MemberAssignedClass.IdClass("M1", "C1");
        assertEquals(idc1, idc2);
        assertEquals(idc1.hashCode(), idc2.hashCode());
        assertNotNull(idc1.toString());
    }

    @Test
    void testServiceEdgeCasesAndExceptions() {
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(null));
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(new LoginRequestDto(null, "pass")));
        assertThrows(IllegalArgumentException.class, () -> schoolService.login(new LoginRequestDto("email", null)));
        assertThrows(RuntimeException.class, () -> schoolService.login(new LoginRequestDto("nonexist@gmail.com", "pass")));

        MemberDto teacherNoId = MemberDto.builder()
                .name("Teacher No ID")
                .email("no_id@teacher.com")
                .password("pass")
                .assignedClasses(null)
                .build();
        MemberDto createdTeacher = schoolService.createTeacher(teacherNoId);
        assertNotNull(createdTeacher.getId());
        assertTrue(createdTeacher.getId().startsWith("GV"));
        assertNotNull(createdTeacher.getAssignedClasses());

        MemberDto studentNoId = MemberDto.builder()
                .name("Student No ID")
                .email("no_id@student.com")
                .password("pass")
                .build();
        MemberDto createdStudent = schoolService.createStudent(studentNoId);
        assertNotNull(createdStudent.getId());
        assertTrue(createdStudent.getId().startsWith("HS"));

        assertThrows(RuntimeException.class, () -> schoolService.updateTeacher("NON_EXISTENT", createdTeacher));
        assertThrows(RuntimeException.class, () -> schoolService.deleteTeacher("NON_EXISTENT"));
        assertThrows(RuntimeException.class, () -> schoolService.updateStudent("NON_EXISTENT", createdStudent));
        assertThrows(RuntimeException.class, () -> schoolService.deleteStudent("NON_EXISTENT"));
        assertThrows(RuntimeException.class, () -> schoolService.deleteClass("NON_EXISTENT"));
        assertThrows(RuntimeException.class, () -> schoolService.enrollStudent("NON_EXISTENT", "10A1"));
        assertThrows(RuntimeException.class, () -> schoolService.enrollTeacherClass("NON_EXISTENT", "10A1"));
        assertThrows(RuntimeException.class, () -> schoolService.unenrollTeacherClass("NON_EXISTENT", "10A1"));
        assertThrows(RuntimeException.class, () -> schoolService.deleteGrade("NON_EXISTENT"));

        schoolService.deleteSubjectGrade("HS001", "math");
        schoolService.deleteSubjectGrade("HS001", "literature");
        schoolService.deleteSubjectGrade("HS001", "english");
        schoolService.deleteSubjectGrade("NON_EXISTENT", "math");

        GradeDto saved1 = schoolService.saveGrade("HS001", null);
        assertNotNull(saved1);

        GradeDto partialDto = GradeDto.builder()
                .math(9.5)
                .build();
        GradeDto saved2 = schoolService.saveGrade("HS001", partialDto);
        assertEquals(9.5, saved2.getMath());

        assertThrows(IllegalArgumentException.class, () -> schoolService.createClass(null));
        assertThrows(IllegalArgumentException.class, () -> schoolService.createClass(new SchoolClassDto("", "Lớp")));

        SchoolClassDto existingClass = new SchoolClassDto("10A1", "Lớp 10A1");
        assertThrows(RuntimeException.class, () -> schoolService.createClass(existingClass));

        SchoolClassDto namelessClass = new SchoolClassDto("12B5", null);
        SchoolClassDto createdNameless = schoolService.createClass(namelessClass);
        assertEquals("Lớp 12B5", createdNameless.getName());
    }
}
