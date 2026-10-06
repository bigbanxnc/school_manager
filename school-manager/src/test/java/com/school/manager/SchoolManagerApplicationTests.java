package com.school.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.manager.config.DatabaseSeeder;
import com.school.manager.controller.SchoolController;
import com.school.manager.dto.*;
import com.school.manager.entity.*;
import com.school.manager.repository.*;
import com.school.manager.service.SchoolService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.school.manager.exception.GlobalExceptionHandler.AppException;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.io.File;
import java.nio.file.Files;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@AutoConfigureMockMvc
class SchoolManagerApplicationTests {

    @Autowired private SchoolService schoolService;
    @Autowired private SchoolClassRepository classRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private GradeRepository gradeRepository;
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private jakarta.persistence.EntityManager entityManager;
    @Autowired private org.springframework.context.ApplicationContext context;

    private Member hs1;

    @BeforeEach
    void setUp() {
        gradeRepository.deleteAll();
        memberRepository.deleteAll();
        classRepository.deleteAll();

        classRepository.save(SchoolClass.builder().code("10A1").name("Lớp 10A1").build());

        memberRepository.save(Member.builder().code("AD001").name("Quản trị viên").email("admin@gmail.com").password("admin123").role("admin").build());
        hs1 = memberRepository.save(Member.builder().code("HS001").name("Nguyễn Văn A").email("hs01@gmail.com").password("student123").role("student").className("10A1").build());
        Member hs2 = memberRepository.save(Member.builder().code("HS002").name("Trần Thị B").email("hs02@gmail.com").password("student123").role("student").className(null).build());
        Member hs3 = memberRepository.save(Member.builder().code("HS003").name("Lê Văn C").email("hs03@gmail.com").password("student123").role("student").className("10A1").build());
        memberRepository.save(Member.builder().code("GV01").name("Nguyễn Văn Hùng").email("gv01@edu.com").password("teacher123").role("teacher").subject("math").assignedClasses(new ArrayList<>(List.of("10A1"))).build());

        gradeRepository.save(Grade.builder().studentId(hs1.getId()).studentCode("HS001").math(8.5).literature(9.0).english(7.0).build());
        gradeRepository.save(Grade.builder().studentId(hs2.getId()).studentCode("HS002").build());
        gradeRepository.save(Grade.builder().studentId(hs3.getId()).studentCode("HS003").math(9.5).build());
    }

    @Test
    void contextLoadsAndInitialData() {
        assertNotNull(schoolService);
        assertFalse(schoolService.getAllClasses().isEmpty());
        assertTrue(schoolService.getAllClasses().stream().anyMatch(c -> "10A1".equals(c.getCode())));
        assertFalse(schoolService.getAllMembers().isEmpty());
        assertTrue(schoolService.getAllMembers().stream().anyMatch(m -> "admin@gmail.com".equals(m.getEmail())));
    }

    @Test
    void testAuthAndLogin() throws Exception {
        MemberDto admin = schoolService.login(new LoginRequestDto("admin@gmail.com", "admin123"));
        assertEquals("Quản trị viên", admin.getName());

        mockMvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequestDto("admin@gmail.com", "admin123"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("admin"));

        assertThrows(AppException.class, () -> schoolService.login(new LoginRequestDto("admin@gmail.com", "wrong")));
        assertThrows(AppException.class, () -> schoolService.login(new LoginRequestDto("nonexist@gmail.com", "pass")));
        assertThrows(AppException.class, () -> schoolService.login(null));
        assertThrows(AppException.class, () -> schoolService.login(new LoginRequestDto(null, "pass")));
        assertThrows(AppException.class, () -> schoolService.login(new LoginRequestDto("email", null)));

        mockMvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequestDto("admin@gmail.com", "wrong"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testTeacherCrudAndBranches() throws Exception {
        MemberDto teacher = MemberDto.builder().name("New Teacher").email("nt@gmail.com").password("pass").role("teacher").subject("math").build();
        MemberDto created = schoolService.createTeacher(teacher);
        assertNotNull(created.getCode());
        assertTrue(created.getCode().startsWith("GV"));

        created.setName("Updated Teacher");
        created.setSubject("literature");
        created.setAssignedClasses(List.of("10A1"));
        MemberDto updated = schoolService.updateTeacher(created.getCode(), created);
        assertEquals("Updated Teacher", updated.getName());

        MemberDto tBlankId = MemberDto.builder().code("  ").name("Blank ID").email("blank@teacher.com").password("pass").role("teacher").build();
        MemberDto createdBlank = schoolService.createTeacher(tBlankId);
        createdBlank.setAssignedClasses(null);
        schoolService.updateTeacher(createdBlank.getCode(), createdBlank);
        schoolService.deleteTeacher(createdBlank.getCode().toLowerCase());

        schoolService.deleteTeacher(created.getCode());
        assertThrows(AppException.class, () -> schoolService.updateTeacher("NON_EXIST", created));
        assertThrows(AppException.class, () -> schoolService.deleteTeacher("NON_EXIST"));

        String res = mockMvc.perform(post("/api/teachers").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacher)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        MemberDto ctrlTeacher = objectMapper.readValue(res, MemberDto.class);

        ctrlTeacher.setName("Controller Teacher Updated");
        mockMvc.perform(put("/api/teachers/" + ctrlTeacher.getCode()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ctrlTeacher))).andExpect(status().isOk());
        mockMvc.perform(delete("/api/teachers/" + ctrlTeacher.getCode())).andExpect(status().isOk());
        mockMvc.perform(put("/api/teachers/NON_EXIST").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ctrlTeacher))).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/teachers/NON_EXIST")).andExpect(status().isNotFound());
    }

    @Test
    void testStudentCrudAndBranches() throws Exception {
        MemberDto student = MemberDto.builder().name("New Student").email("ns@gmail.com").password("pass").role("student").build();
        MemberDto created = schoolService.createStudent(student);
        assertNotNull(created.getCode());
        assertTrue(created.getCode().startsWith("HS"));

        created.setName("Updated Student");
        created.setClassName("10A1");
        MemberDto updated = schoolService.updateStudent(created.getCode(), created);
        assertEquals("10A1", updated.getClassName());

        MemberDto sBlank = MemberDto.builder().code("").name("Blank Student").email("bs@gmail.com").password("pass").role("student").build();
        MemberDto createdBlank = schoolService.createStudent(sBlank);
        schoolService.deleteStudent(createdBlank.getCode().toLowerCase());

        schoolService.deleteStudent(created.getCode());
        assertThrows(AppException.class, () -> schoolService.updateStudent("NON_EXIST", created));
        assertThrows(AppException.class, () -> schoolService.deleteStudent("NON_EXIST"));

        schoolService.deleteStudent("hs001");
        entityManager.flush();
        entityManager.clear();
        assertFalse(memberRepository.findByCode("HS001").isPresent());

        String res = mockMvc.perform(post("/api/students").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        MemberDto ctrlStudent = objectMapper.readValue(res, MemberDto.class);

        ctrlStudent.setName("Ctrl Student");
        mockMvc.perform(put("/api/students/" + ctrlStudent.getCode()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ctrlStudent))).andExpect(status().isOk());
        mockMvc.perform(delete("/api/students/" + ctrlStudent.getCode())).andExpect(status().isOk());
        mockMvc.perform(put("/api/students/NON_EXIST").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ctrlStudent))).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/students/NON_EXIST")).andExpect(status().isNotFound());
    }

    @Test
    void testClassCrudAndBranches() throws Exception {
        SchoolClassDto c9A1 = schoolService.createClass(new SchoolClassDto("9A1", "Lớp 9A1"));
        assertEquals("9A1", c9A1.getCode());
        assertThrows(AppException.class, () -> schoolService.createClass(c9A1));
        assertThrows(AppException.class, () -> schoolService.createClass(null));
        assertThrows(AppException.class, () -> schoolService.createClass(new SchoolClassDto("", "Lớp")));

        SchoolClassDto nameless = schoolService.createClass(new SchoolClassDto("11B6", "   "));
        assertEquals("Lớp 11B6", nameless.getName());

        schoolService.deleteClass("10A1");
        schoolService.deleteClass("9A1");
        assertThrows(AppException.class, () -> schoolService.deleteClass("NON_EXIST"));

        SchoolClassDto ctrlClass = new SchoolClassDto("11B2", "Lớp 11B2");
        mockMvc.perform(get("/api/classes")).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
        mockMvc.perform(post("/api/classes").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(ctrlClass))).andExpect(status().isOk());
        mockMvc.perform(post("/api/classes").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(ctrlClass))).andExpect(status().isConflict());
        mockMvc.perform(post("/api/classes").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new SchoolClassDto()))).andExpect(status().isBadRequest());
        mockMvc.perform(delete("/api/classes/11B2")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/classes/NON_EXIST")).andExpect(status().isNotFound());
    }

    @Test
    void testEnrollments() throws Exception {
        MemberDto student = schoolService.createStudent(MemberDto.builder().name("Enr S").email("es@gmail.com").password("p").build());
        MemberDto teacher = schoolService.createTeacher(MemberDto.builder().name("Enr T").email("et@gmail.com").password("p").build());

        assertEquals("10A1", schoolService.enrollStudent(student.getCode(), "10A1").getClassName());
        assertTrue(schoolService.enrollTeacherClass(teacher.getCode(), "10A1").getAssignedClasses().contains("10A1"));
        assertEquals(1, schoolService.enrollTeacherClass(teacher.getCode(), "10A1").getAssignedClasses().stream().filter("10A1"::equals).count());
        assertFalse(schoolService.unenrollTeacherClass(teacher.getCode(), "10A1").getAssignedClasses().contains("10A1"));

        assertThrows(AppException.class, () -> schoolService.enrollStudent("NON_EXIST", "10A1"));
        assertThrows(AppException.class, () -> schoolService.enrollTeacherClass("NON_EXIST", "10A1"));
        assertThrows(AppException.class, () -> schoolService.unenrollTeacherClass("NON_EXIST", "10A1"));

        Map<String, String> sPayload = Map.of("id", "HS001", "className", "10A1");
        mockMvc.perform(post("/api/enroll/student").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sPayload))).andExpect(status().isOk());
        mockMvc.perform(post("/api/enroll/student").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(Map.of("id", "NON_EXIST", "className", "10A1")))).andExpect(status().isNotFound());

        Map<String, String> tPayload = Map.of("id", "GV01", "className", "10A1");
        mockMvc.perform(post("/api/enroll/teacher").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(tPayload))).andExpect(status().isOk());
        mockMvc.perform(post("/api/enroll/teacher").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(Map.of("id", "NON_EXIST", "className", "10A1")))).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/unenroll/teacher").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(tPayload))).andExpect(status().isOk());
        mockMvc.perform(post("/api/unenroll/teacher").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(Map.of("id", "NON_EXIST", "className", "10A1")))).andExpect(status().isNotFound());
    }

    @Test
    void testGradesSubjectAveragesAndTeacherPermissions() throws Exception {
        GradeDto fullDto = GradeDto.builder().math_oral(8.0).math_m15(9.0).math_mid(7.0).math_final(10.0).build();
        assertEquals(8.71, schoolService.saveGrade("HS001", fullDto).getMath());

        GradeDto partialDto = GradeDto.builder().math_m15(9.0).math_final(8.0).build();
        assertEquals(8.25, schoolService.saveGrade("HS001", partialDto).getMath());

        GradeDto explicitDto = GradeDto.builder().math(7.5).build();
        assertEquals(7.5, schoolService.saveGrade("HS001", explicitDto).getMath());

        GradeDto emptyDto = GradeDto.builder().build();
        assertNull(schoolService.saveGrade("HS001", emptyDto).getMath());
        assertNotNull(schoolService.saveGrade("HS001", null));

        memberRepository.save(Member.builder().code("GV02").name("Lit T").email("gv02@gmail.com").password("p").role("teacher").subject("literature").build());
        memberRepository.save(Member.builder().code("GV03").name("Eng T").email("gv03@gmail.com").password("p").role("teacher").subject("english").build());

        schoolService.saveGrade("HS001", GradeDto.builder().math(8.0).literature(7.0).english(6.0).build());

        GradeDto mathUp = schoolService.saveGrade("HS001", GradeDto.builder().math_oral(9.0).math_m15(10.0).math_mid(9.0).math_final(9.0).literature_oral(10.0).updatedBy("GV01").build());
        assertEquals(9.14, mathUp.getMath());
        assertEquals(7.0, mathUp.getLiterature());

        GradeDto litUp = schoolService.saveGrade("HS001", GradeDto.builder().literature_oral(8.0).literature_m15(8.0).literature_mid(8.0).literature_final(8.0).math_oral(1.0).updatedBy("GV02").build());
        assertEquals(8.0, litUp.getLiterature());
        assertEquals(9.14, litUp.getMath());

        GradeDto engUp = schoolService.saveGrade("HS001", GradeDto.builder().english_oral(9.5).english_m15(9.5).english_mid(9.5).english_final(9.5).updatedBy("GV03").build());
        assertEquals(9.5, engUp.getEnglish());

        GradeDto adminUp = schoolService.saveGrade("HS001", GradeDto.builder().math(5.0).literature(5.0).english(5.0).updatedBy("AD001").build());
        assertEquals(5.0, adminUp.getMath());

        schoolService.deleteSubjectGrade("HS001", "math");
        schoolService.deleteSubjectGrade("HS001", "literature");
        schoolService.deleteSubjectGrade("HS001", "english");
        schoolService.deleteSubjectGrade("HS001", "science");
        schoolService.deleteSubjectGrade("NON_EXIST", "math");

        schoolService.deleteGrade("HS001");
        assertThrows(AppException.class, () -> schoolService.deleteGrade("HS001"));

        GradeDto ctrlGradePayload = GradeDto.builder().literature_oral(9.0).literature_m15(9.0).literature_mid(9.0).literature_final(9.0).updatedBy("GV02").build();
        mockMvc.perform(put("/api/grades/HS001").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(ctrlGradePayload)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.literature").value(9.0));

        mockMvc.perform(delete("/api/grades/HS001/subject/science")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/grades/HS001")).andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();
        mockMvc.perform(delete("/api/grades/HS001")).andExpect(status().isNotFound());
    }

    @Test
    void testQueriesAndPagination() throws Exception {
        assertFalse(schoolService.getMembersByRole("student").isEmpty());
        assertFalse(schoolService.getMembersByRoleAndClassName("student", "10A1").isEmpty());
        assertFalse(schoolService.getMembersByRoleAndSubject("teacher", "math").isEmpty());
        assertNotNull(schoolService.getTeachersByClassId("10A1"));
        assertFalse(schoolService.searchMembersByName("Nguyễn").isEmpty());
        assertNotNull(schoolService.getClassByName("Lớp 10A1"));
        assertTrue(schoolService.existsClassByName("Lớp 10A1"));
        assertFalse(schoolService.existsClassByName("Non Existent Class"));

        assertFalse(schoolService.getExcellentMathStudents(8.0).isEmpty());
        assertFalse(schoolService.getExcellentLiteratureStudents(8.0).isEmpty());
        assertFalse(schoolService.getExcellentEnglishStudents(6.5).isEmpty());
        assertFalse(schoolService.getStudentsWithCompleteGrades().isEmpty());

        mockMvc.perform(get("/api/queries/members/role/student")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/members/role/student/class/10A1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/members/role/teacher/subject/math")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/members/teachers/class/10A1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/members/search").param("keyword", "Nguyễn")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/classes/by-name/Lớp 10A1")).andExpect(status().isOk()).andExpect(jsonPath("$.code").value("10A1"));
        mockMvc.perform(get("/api/queries/classes/by-name/NonExist")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/queries/classes/exists/Lớp 10A1")).andExpect(status().isOk()).andExpect(jsonPath("$.exists").value(true));

        mockMvc.perform(get("/api/queries/grades/excellent/math").param("minScore", "8.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/grades/excellent/literature").param("minScore", "8.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/grades/excellent/english").param("minScore", "8.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/queries/grades/complete")).andExpect(status().isOk());

        mockMvc.perform(get("/api/members").param("role", "student").param("search", "hs001").param("page", "1").param("size", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
        mockMvc.perform(get("/api/members").param("role", "   ").param("page", "99")).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
        mockMvc.perform(get("/api/members").param("role", "invalid_role")).andExpect(status().isOk());

        mockMvc.perform(get("/api/teachers").param("search", "Hùng").param("page", "1").param("size", "5"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].code").value("GV01"));
        mockMvc.perform(get("/api/teachers").param("search", "non_exist").param("page", "5")).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());

        memberRepository.save(Member.builder().code("GV02").name("Lit T").email("gv02@edu.com").password("p").role("teacher").subject("literature").build());
        memberRepository.save(Member.builder().code("GV03").name("Eng T").email("gv03@edu.com").password("p").role("teacher").subject("english").build());

        for (String search : List.of("HS001", "HS002", "HS003", "10A1", "Chưa xếp lớp", "8.17", "9.5", "9.0", "7.0", "unmatched_query")) {
            mockMvc.perform(get("/api/grades").param("page", "1").param("size", "10").param("search", search)).andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/grades").param("classes", "10A1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("classes", "10A1").param("page", "1").param("size", "5")).andExpect(status().isOk());

        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "5").param("currentUserId", "GV01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].math").value(8.5)).andExpect(jsonPath("$.content[0].literature").doesNotExist());
        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "5").param("currentUserId", "GV02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].literature").value(9.0)).andExpect(jsonPath("$.content[0].math").doesNotExist());
        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "5").param("currentUserId", "GV03"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].english").value(7.0)).andExpect(jsonPath("$.content[0].math").doesNotExist());

        mockMvc.perform(get("/api/grades/HS001").param("currentUserId", "GV01")).andExpect(status().isOk()).andExpect(jsonPath("$.math").value(8.5)).andExpect(jsonPath("$.literature").doesNotExist());
        mockMvc.perform(get("/api/grades/HS001").param("currentUserId", "GV02")).andExpect(status().isOk()).andExpect(jsonPath("$.literature").value(9.0));
        mockMvc.perform(get("/api/grades/HS001").param("currentUserId", "GV03")).andExpect(status().isOk()).andExpect(jsonPath("$.english").value(7.0));
    }

    @Test
    void testAutoAssignTeachers() throws Exception {
        classRepository.save(SchoolClass.builder().code("10A2").name("Lớp 10A2").build());
        memberRepository.save(Member.builder().code("GV02").name("Lit T").email("gv02@edu.com").password("p").role("teacher").subject("literature").build());
        memberRepository.save(Member.builder().code("GV03").name("Eng T").email("gv03@edu.com").password("p").role("teacher").subject("english").build());

        assertNotNull(schoolService.autoAssignTeachers());

        gradeRepository.deleteAll(); memberRepository.deleteAll(); classRepository.deleteAll();
        classRepository.save(SchoolClass.builder().code("9A1").name("Lớp 9A1").build());
        memberRepository.save(Member.builder().code("T1").name("Math 1").email("t1@edu.com").password("p").role("teacher").subject("math").build());
        memberRepository.save(Member.builder().code("T2").name("Math 2").email("t2@edu.com").password("p").role("teacher").subject("math").build());

        assertNotNull(schoolService.autoAssignTeachers());
        mockMvc.perform(post("/api/teachers/auto-assign")).andExpect(status().isOk());
    }

    @Test
    void testDatabaseSeederAndMain() throws Exception {
        DatabaseSeeder.DbData dbData = new DatabaseSeeder.DbData();
        dbData.setClasses(new ArrayList<>()); dbData.setMembers(new ArrayList<>()); dbData.setGrades(new ArrayList<>());
        assertNotNull(dbData.getClasses()); assertNotNull(dbData.getMembers()); assertNotNull(dbData.getGrades());
        DatabaseSeeder.DbData dbDataAll = new DatabaseSeeder.DbData(new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
        assertNotNull(dbDataAll.getClasses());

        entityManager.clear();
        CommandLineRunner runner = (CommandLineRunner) context.getBean("initDatabase");
        assertNotNull(runner);
        runner.run();
        entityManager.clear();
        runner.run("arg1", "arg2");

        File customDbJson = new File("db.json");
        String jsonStr = """
                {
                  "classes": [
                    { "id": "C10", "name": "Lớp 10A1" },
                    { "id": "C11", "name": "Lớp 11A1" },
                    { "id": "C12", "name": "Lớp 12A1" },
                    { "id": "C9", "name": "Lớp 9A1" },
                    { "id": "CNULL", "name": null }
                  ],
                  "members": [{ "id": "M_TEST", "email": "t@school.com", "password": "p", "role": "teacher", "name": "T", "subject": "math", "assignedClasses": ["C10"] }],
                  "grades": [{ "id": "G_TEST", "studentId": "M_STUDENT", "classId": "C10", "subject": "math", "score": 8.5, "term": "HK1" }]
                }""";
        Files.writeString(customDbJson.toPath(), jsonStr);
        try {
            entityManager.clear();
            runner.run();
        } finally {
            Files.deleteIfExists(customDbJson.toPath());
        }

        Files.writeString(customDbJson.toPath(), "INVALID_JSON_{{");
        try {
            entityManager.clear();
            runner.run();
        } finally {
            Files.deleteIfExists(customDbJson.toPath());
        }

        Files.writeString(customDbJson.toPath(), "{\"classes\": null, \"members\": null, \"grades\": null}");
        try {
            entityManager.clear();
            runner.run();
        } finally {
            Files.deleteIfExists(customDbJson.toPath());
        }

        Files.deleteIfExists(customDbJson.toPath());
        entityManager.clear();
        runner.run();

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
    void testControllerBranchCoverage() throws Exception {
        mockMvc.perform(get("/api/members").param("classes", "10A1,10A2").param("search", "  ").param("role", "  ")).andExpect(status().isOk());
        mockMvc.perform(get("/api/members").param("classes", "  ").param("search", "HS001").param("role", "student")).andExpect(status().isOk());
        mockMvc.perform(get("/api/members").param("page", "1").param("size", "10").param("search", "NON_EXISTENT_QUERY_XYZ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(1));

        memberRepository.save(Member.builder().code("GV_NULL").name(null).email("gv_null@edu.com").password("p").subject(null).assignedClasses(Collections.singletonList(null)).role("teacher").build());

        mockMvc.perform(get("/api/teachers").param("search", "GV01")).andExpect(status().isOk());
        mockMvc.perform(get("/api/teachers").param("search", "gv01@edu.com")).andExpect(status().isOk());
        mockMvc.perform(get("/api/teachers").param("search", "math")).andExpect(status().isOk());
        mockMvc.perform(get("/api/teachers").param("search", "10A1")).andExpect(status().isOk());

        mockMvc.perform(get("/api/teachers").param("page", "1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/teachers").param("page", "1").param("size", "2")).andExpect(status().isOk());
        mockMvc.perform(get("/api/teachers").param("page", "999").param("size", "10")).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
        mockMvc.perform(get("/api/teachers").param("page", "1").param("search", "NON_EXISTENT_SEARCH")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(1));

        memberRepository.save(Member.builder().code("GV_PHYS").name("Phys T").email("phys@edu.com").password("p").role("teacher").subject("physics").build());

        for (String q : List.of("> 8.0", "< 9.0", ">= 8.5", "<= 7.0", "= 8.5", "8.5", "8", "> invalid_num")) {
            mockMvc.perform(get("/api/grades").param("search", q)).andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/grades").param("scoreSubject", "subjectGpa").param("scoreOp", "gte").param("scoreVal", "8.0").param("currentUserId", "GV01")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "subjectGpa").param("scoreOp", "gte").param("scoreVal", "8.0").param("currentUserId", "AD001")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "oral").param("scoreOp", "lte").param("scoreVal", "10.0").param("currentUserId", "GV02")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "m15").param("scoreOp", "eq").param("scoreVal", "9.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "mid").param("scoreOp", "eq").param("scoreVal", "8.5")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "final").param("scoreOp", "other_op").param("scoreVal", "5.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("scoreSubject", "math").param("scoreOp", "gte").param("scoreVal", "8.0")).andExpect(status().isOk());

        mockMvc.perform(get("/api/grades").param("currentUserId", "GV_PHYS")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("currentUserId", "NON_EXISTENT_ID")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("currentUserId", "   ")).andExpect(status().isOk());

        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "2").param("search", "> 8.0")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades").param("page", "999").param("size", "2").param("search", "> 8.0")).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
        mockMvc.perform(get("/api/grades").param("page", "1").param("size", "2").param("search", "> 99.0")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(1));

        mockMvc.perform(get("/api/grades/HS001").param("currentUserId", "GV_PHYS")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades/HS001").param("currentUserId", "NON_EXISTENT_ID")).andExpect(status().isOk());
        mockMvc.perform(get("/api/grades/NON_EXISTENT_HS")).andExpect(status().isOk());

        GradeDto physicsGrade = GradeDto.builder().updatedBy("GV_PHYS").build();
        mockMvc.perform(put("/api/grades/HS001").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(physicsGrade))).andExpect(status().isOk());

        GradeDto blankUserGrade = GradeDto.builder().updatedBy("   ").build();
        mockMvc.perform(put("/api/grades/HS001").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(blankUserGrade))).andExpect(status().isOk());

        GradeDto nullUserGrade = GradeDto.builder().updatedBy(null).build();
        mockMvc.perform(put("/api/grades/HS001").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(nullUserGrade))).andExpect(status().isOk());
    }

    @Test
    void testMappersAndEntities() {
        var gradeMapper = context.getBean(com.school.manager.mapper.GradeMapper.class);
        var memberMapper = context.getBean(com.school.manager.mapper.MemberMapper.class);
        var classMapper = context.getBean(com.school.manager.mapper.SchoolClassMapper.class);

        assertNull(gradeMapper.toDto(null)); assertNull(gradeMapper.toEntity(null));
        assertNull(memberMapper.toDto(null)); assertNull(memberMapper.toEntity(null));
        assertNull(classMapper.toDto(null)); assertNull(classMapper.toEntity(null));

        GradeDto sampleDto = GradeDto.builder()
                .studentId(101L)
                .studentCode("HS_MAPPED")
                .math(9.0).literature(8.5).english(8.0)
                .math_oral(9.0).math_m15(9.0).math_mid(9.0).math_final(9.0)
                .literature_oral(8.5).literature_m15(8.5).literature_mid(8.5).literature_final(8.5)
                .english_oral(8.0).english_m15(8.0).english_mid(8.0).english_final(8.0)
                .build();
        Grade mappedEntity = gradeMapper.toEntity(sampleDto);
        assertNotNull(mappedEntity);
        assertEquals(101L, mappedEntity.getStudentId());
        assertEquals("HS_MAPPED", mappedEntity.getStudentCode());
        assertEquals(9.0, mappedEntity.getMath());
        assertEquals(8.5, mappedEntity.getLiterature());
        assertEquals(8.0, mappedEntity.getEnglish());
        assertEquals(9.0, mappedEntity.getMath_oral());
        assertEquals(8.5, mappedEntity.getLiterature_oral());
        assertEquals(8.0, mappedEntity.getEnglish_oral());

        Grade sampleEntity = Grade.builder()
                .studentId(102L)
                .studentCode("HS_MAPPED_2")
                .math(10.0).literature(9.0).english(8.0)
                .math_oral(10.0).math_m15(10.0).math_mid(10.0).math_final(10.0)
                .literature_oral(9.0).literature_m15(9.0).literature_mid(9.0).literature_final(9.0)
                .english_oral(8.0).english_m15(8.0).english_mid(8.0).english_final(8.0)
                .build();
        GradeDto mappedDto = gradeMapper.toDto(sampleEntity);
        assertNotNull(mappedDto);
        assertEquals(102L, mappedDto.getStudentId());
        assertEquals("HS_MAPPED_2", mappedDto.getStudentCode());
        assertEquals(10.0, mappedDto.getMath());
        assertEquals(9.0, mappedDto.getLiterature());
        assertEquals(8.0, mappedDto.getEnglish());

        Member mWithAssigned = Member.builder().code("M_A1").email("ma1@edu.com").password("p").name("A1").role("teacher").assignedClasses(List.of("10A1", "10A2")).build();
        MemberDto mDtoWithAssigned = memberMapper.toDto(mWithAssigned);
        assertNotNull(mDtoWithAssigned);
        assertEquals(List.of("10A1", "10A2"), mDtoWithAssigned.getAssignedClasses());

        MemberDto dtoWithAssigned = MemberDto.builder().code("M_A2").email("ma2@edu.com").password("p").name("A2").role("teacher").assignedClasses(List.of("10A1")).build();
        Member mEntityWithAssigned = memberMapper.toEntity(dtoWithAssigned);
        assertNotNull(mEntityWithAssigned);
        assertEquals(List.of("10A1"), mEntityWithAssigned.getAssignedClasses());

        assertTrue(memberMapper.toDto(Member.builder().code("M_N1").email("mn1@edu.com").password("p").name("N1").role("student").assignedClasses(null).build()).getAssignedClasses().isEmpty());
        assertTrue(memberMapper.toEntity(MemberDto.builder().code("M_N2").email("mn2@edu.com").password("p").name("N2").role("student").assignedClasses(null).build()).getAssignedClasses().isEmpty());

        SchoolClass scSample = SchoolClass.builder().code("C10").name("10A10").build();
        SchoolClassDto scDtoSample = classMapper.toDto(scSample);
        assertNotNull(scDtoSample);
        assertEquals("C10", scDtoSample.getCode());
        assertEquals("10A10", scDtoSample.getName());

        SchoolClassDto scDtoIn = SchoolClassDto.builder().code("C11").name("10A11").build();
        SchoolClass scEntityIn = classMapper.toEntity(scDtoIn);
        assertNotNull(scEntityIn);
        assertEquals("C11", scEntityIn.getCode());
        assertEquals("10A11", scEntityIn.getName());

        Grade g1 = Grade.builder().studentId(1L).math(8.0).build();
        Grade g2 = Grade.builder().studentId(1L).math(8.0).build();
        Grade g3 = Grade.builder().studentId(2L).build();
        assertEquals(g1, g2); assertNotEquals(g1, g3); assertEquals(g1.hashCode(), g2.hashCode());
        assertNotNull(g1.toString()); assertEquals(1L, g1.getStudentId());

        Member m1 = Member.builder().code("M1").name("N").email("e@test.com").password("p").role("student").className("C").subject("S").assignedClasses(new ArrayList<>()).build();
        Member m2 = Member.builder().code("M1").name("N").email("e@test.com").password("p").role("student").className("C").subject("S").assignedClasses(new ArrayList<>()).build();
        Member m3 = Member.builder().code("M2").name("N3").email("e3@test.com").password("p").role("student").build();
        assertEquals(m1, m2); assertNotEquals(m1, m3); assertEquals(m1.hashCode(), m2.hashCode());
        assertNotNull(m1.toString());
        m1.setClassName("10A1"); assertEquals("10A1", m1.getClassName());
        m1.setSubject("math"); assertEquals("math", m1.getSubject());
        m1.setAssignedClasses(List.of("10A1")); assertEquals(List.of("10A1"), m1.getAssignedClasses());

        Member mAllNull = new Member();
        mAllNull.ensureNonNullFields();
        assertNotNull(mAllNull.getCode());
        assertTrue(mAllNull.getEmail().endsWith("@school.com"));
        assertEquals("student", mAllNull.getRole());
        assertEquals(com.school.manager.util.PasswordUtil.sha1Hex("hs123"), mAllNull.getPassword());
        assertTrue(mAllNull.getName().startsWith("Thành viên "));

        Member mEmpty = Member.builder().code("  ").email("  ").role("  ").password("  ").name("  ").build();
        mEmpty.ensureNonNullFields();
        assertNotNull(mEmpty.getCode());
        assertEquals(com.school.manager.util.PasswordUtil.sha1Hex("hs123"), mEmpty.getPassword());

        Member mAdminNullPass = Member.builder().code("M_ADM").email("a@a.com").role("admin").password(null).name("Admin").build();
        mAdminNullPass.ensureNonNullFields();
        assertEquals(com.school.manager.util.PasswordUtil.sha1Hex("admin123"), mAdminNullPass.getPassword());

        Member mTeacherNullPass = Member.builder().code("M_TCH").email("t@t.com").role("teacher").password("  ").name("Teacher").build();
        mTeacherNullPass.ensureNonNullFields();
        assertEquals(com.school.manager.util.PasswordUtil.sha1Hex("teacher123"), mTeacherNullPass.getPassword());

        Member mFullyPopulated = Member.builder().code("M_FULL").email("f@f.com").role("custom").password("custom123").name("Full").build();
        mFullyPopulated.ensureNonNullFields();
        assertEquals(com.school.manager.util.PasswordUtil.sha1Hex("custom123"), mFullyPopulated.getPassword());

        SchoolClass sc1 = SchoolClass.builder().code("C1").name("Class").build();
        SchoolClass sc2 = SchoolClass.builder().code("C1").name("Class").build();
        SchoolClass sc3 = SchoolClass.builder().code("C2").build();
        assertEquals(sc1, sc2); assertNotEquals(sc1, sc3); assertEquals(sc1.hashCode(), sc2.hashCode());
        assertNotNull(sc1.toString());

        assertNull(com.school.manager.util.PasswordUtil.sha1Hex(null));
        assertNull(com.school.manager.util.PasswordUtil.ensureSha1(null));
        assertNull(com.school.manager.util.PasswordUtil.ensureSha1("   "));
        assertFalse(com.school.manager.util.PasswordUtil.matches(null, "hash"));
        assertFalse(com.school.manager.util.PasswordUtil.matches("pass", null));
        String sampleSha1 = com.school.manager.util.PasswordUtil.sha1Hex("admin123");
        assertTrue(com.school.manager.util.PasswordUtil.isSha1(sampleSha1));
        assertFalse(com.school.manager.util.PasswordUtil.isSha1("short"));
        assertEquals(sampleSha1, com.school.manager.util.PasswordUtil.ensureSha1(sampleSha1));
        assertTrue(com.school.manager.util.PasswordUtil.matches("admin123", sampleSha1));
    }

    @Test
    void testSpecificationsFullCoverage() throws Exception {
        entityManager.flush();
        entityManager.clear();

        var gradeSpecConstructor = com.school.manager.specification.GradeSpecification.class.getDeclaredConstructor();
        gradeSpecConstructor.setAccessible(true);
        gradeSpecConstructor.newInstance();

        var memberSpecConstructor = com.school.manager.specification.MemberSpecification.class.getDeclaredConstructor();
        memberSpecConstructor.setAccessible(true);
        memberSpecConstructor.newInstance();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Grade> gradeQuery = cb.createQuery(Grade.class);
        Root<Grade> dummyGradeRoot = gradeQuery.from(Grade.class);

        CriteriaQuery<Member> memberQuery = cb.createQuery(Member.class);
        Root<Member> dummyMemberRoot = memberQuery.from(Member.class);

        var nullQueryGradePred = com.school.manager.specification.GradeSpecification
                .filterGrades(null, null, null, null, null, null)
                .toPredicate(dummyGradeRoot, gradeQuery, cb);
        assertNotNull(nullQueryGradePred);

        var nullQueryMemberPred = com.school.manager.specification.MemberSpecification
                .filterMembers(null, null, false, null, null, false)
                .toPredicate(dummyMemberRoot, memberQuery, cb);
        assertNotNull(nullQueryMemberPred);

        assertTrue(gradeRepository.count(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, null)) >= 0);
        assertTrue(memberRepository.count(com.school.manager.specification.MemberSpecification.filterMembers("student", null, false, null, null, false)) >= 0);

        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, List.of("10A1", "chưa xếp lớp"))));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, Arrays.asList("10A1", null, "   "))));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, List.of("10A1"))));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, List.of("chưa xếp lớp"))));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, null, Collections.singletonList(null))));

        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("none", "gte", 8.0, null, null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("subjectgpa", "gt", 8.0, "math", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("subjectgpa", "lt", 8.0, "literature", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("subjectgpa", "lte", 8.0, "", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("oral", "eq", 8.0, "english", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("m15", "eq", 8.5, null, null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("mid", "gte", 8.0, "math", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("final", "unknown_op", 8.0, "math", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("final", null, 8.0, "math", null, null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades("math", "gte", 8.0, null, null, null)));

        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "= 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "literature", "= 8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "english", "> 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "physics", "< 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, ">= 8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "", "<= 8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "7.8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "7.81", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "math m15 8.0", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "english oral 9", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "literature final 8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "math mid 9", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "gpa >= 8.0", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "oral 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "m15 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "mid 8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, null, "final 8", null)));

        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "hoc sinh", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "student", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "học sinh", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "chưa xếp lớp", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "8", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "8.5", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "Nguyen", null)));
        assertNotNull(gradeRepository.findAll(com.school.manager.specification.GradeSpecification.filterGrades(null, null, null, "math", "   ", null)));

        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers("student", null, false, null, null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers("   ", null, false, null, null, false)));

        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, List.of("10A1"), true, "GV01", null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, List.of("10A1"), true, null, null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, List.of("10A1"), true, "   ", null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, List.of("10A1"), false, null, null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, true, null, null, false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, List.of(), true, null, null, false)));

        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "giáo viên", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "giao vien", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "teacher", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "học sinh", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "hoc sinh", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "student", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "quản trị viên", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "quan tri vien", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "admin", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "chưa xếp lớp", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "Nguyễn", true)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "Nguyễn", false)));
        assertNotNull(memberRepository.findAll(com.school.manager.specification.MemberSpecification.filterMembers(null, null, false, null, "   ", true)));

        var m = com.school.manager.specification.GradeSpecification.class
                .getDeclaredMethod("buildScoreSearchPredicate", jakarta.persistence.criteria.Root.class, jakarta.persistence.criteria.CriteriaBuilder.class, String.class, String.class, double.class, int.class);
        m.setAccessible(true);
        m.invoke(null, dummyGradeRoot, cb, "math", null, 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "unknown_op", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "eq", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "eq", 7.8, 1);
        m.invoke(null, dummyGradeRoot, cb, "math", "eq", 7.81, 2);
        m.invoke(null, dummyGradeRoot, cb, "math", "exact_eq", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "gt", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "lt", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "gte", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "math", "lte", 8.0, 0);
        m.invoke(null, dummyGradeRoot, cb, "invalid_field", "gt", 8.0, 0);
    }

    @Test
    void testGlobalExceptionHandlerAndExceptions() throws Exception {
        com.school.manager.exception.GlobalExceptionHandler handler = new com.school.manager.exception.GlobalExceptionHandler();
        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/api/test-error");

        var nfResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.notFound("Không tìm thấy tài nguyên"), request);
        assertEquals(404, nfResp.getStatusCode().value());
        assertEquals("Không tìm thấy tài nguyên", Objects.requireNonNull(nfResp.getBody()).getMessage());
        assertEquals("/api/test-error", nfResp.getBody().getPath());

        var unauthResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.unauthorized("Chưa xác thực"), request);
        assertEquals(401, unauthResp.getStatusCode().value());

        var badReqResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.badRequest("Yêu cầu không hợp lệ"), request);
        assertEquals(400, badReqResp.getStatusCode().value());

        var forbResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.forbidden("Bị cấm truy cập"), request);
        assertEquals(403, forbResp.getStatusCode().value());

        var dupResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.conflict("Dữ liệu trùng lặp"), request);
        assertEquals(409, dupResp.getStatusCode().value());

        var unprocResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.unprocessable("Không thể xử lý entity"), request);
        assertEquals(422, unprocResp.getStatusCode().value());

        var tooManyResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.tooManyRequests("Quá nhiều request"), request);
        assertEquals(429, tooManyResp.getStatusCode().value());

        var servUnavailResp = handler.handleAppException(com.school.manager.exception.GlobalExceptionHandler.AppException.serviceUnavailable("Dịch vụ bảo trì"), request);
        assertEquals(503, servUnavailResp.getStatusCode().value());

        var customAppEx = new com.school.manager.exception.GlobalExceptionHandler.AppException(null, "Lỗi mặc định");
        assertEquals(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, customAppEx.getStatus());

        var rseResp = handler.handleResponseStatusException(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy"), request);
        assertEquals(404, rseResp.getStatusCode().value());

        var illResp = handler.handleIllegalArgumentException(new IllegalArgumentException("Tham số không hợp lệ"), request);
        assertEquals(400, illResp.getStatusCode().value());

        var genErrResp = handler.handleGeneralException(new RuntimeException("Lỗi máy chủ"), request);
        assertEquals(500, genErrResp.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genErrResp.getBody()).getMessage());

        var genNfEx = handler.handleGeneralException(new RuntimeException("Không tìm thấy học sinh"), request);
        assertEquals(500, genNfEx.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genNfEx.getBody()).getMessage());

        var genDupEx = handler.handleGeneralException(new RuntimeException("Mã lớp đã tồn tại"), request);
        assertEquals(500, genDupEx.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genDupEx.getBody()).getMessage());

        var genUnauthEx = handler.handleGeneralException(new RuntimeException("Email hoặc mật khẩu không chính xác!"), request);
        assertEquals(500, genUnauthEx.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genUnauthEx.getBody()).getMessage());

        var genForbEx = handler.handleGeneralException(new RuntimeException("Không có quyền truy cập"), request);
        assertEquals(500, genForbEx.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genForbEx.getBody()).getMessage());

        var noHandlerResp = handler.handleNoHandlerFound(new org.springframework.web.servlet.NoHandlerFoundException("GET", "/api/unknown", new org.springframework.http.HttpHeaders()), request);
        assertEquals(404, noHandlerResp.getStatusCode().value());

        var methodNotSuppResp = handler.handleMethodNotSupported(new org.springframework.web.HttpRequestMethodNotSupportedException("POST"), request);
        assertEquals(405, methodNotSuppResp.getStatusCode().value());

        var missingParamResp = handler.handleMissingParameter(new org.springframework.web.bind.MissingServletRequestParameterException("param1", "String"), request);
        assertEquals(400, missingParamResp.getStatusCode().value());

        org.springframework.core.MethodParameter methodParameter = new org.springframework.core.MethodParameter(
                SchoolController.class.getMethod("login", LoginRequestDto.class), 0);
        var typeMismatchResp = handler.handleTypeMismatch(
                new org.springframework.web.method.annotation.MethodArgumentTypeMismatchException("abc", Integer.class, "score", methodParameter, null), request);
        assertEquals(400, typeMismatchResp.getStatusCode().value());

        var genNullErrResp = handler.handleGeneralException(new RuntimeException(), request);
        assertEquals(500, genNullErrResp.getStatusCode().value());
        assertEquals("Đã xảy ra lỗi hệ thống", Objects.requireNonNull(genNullErrResp.getBody()).getMessage());

        com.school.manager.exception.GlobalExceptionHandler.ErrorResponse errorResponse = new com.school.manager.exception.GlobalExceptionHandler.ErrorResponse();
        errorResponse.setStatus(404);
        errorResponse.setError("Not Found");
        errorResponse.setMessage("Test message");
        errorResponse.setTimestamp(java.time.LocalDateTime.now());
        errorResponse.setPath("/test");
        errorResponse.setErrors(java.util.Map.of("field", "Lỗi"));
        assertEquals(404, errorResponse.getStatus());
        assertEquals("Not Found", errorResponse.getError());
        assertEquals("Test message", errorResponse.getMessage());
        assertNotNull(errorResponse.getTimestamp());
        assertEquals("/test", errorResponse.getPath());
        assertEquals("Lỗi", errorResponse.getErrors().get("field"));
        assertNotNull(errorResponse.toString());

        org.springframework.validation.BeanPropertyBindingResult bindingResult =
                new org.springframework.validation.BeanPropertyBindingResult(new MemberDto(), "memberDto");
        bindingResult.addError(new org.springframework.validation.FieldError("memberDto", "email", "Email không hợp lệ"));
        bindingResult.addError(new org.springframework.validation.FieldError("memberDto", "password", "Mật khẩu quá ngắn"));
        var valEx = new org.springframework.web.bind.MethodArgumentNotValidException(methodParameter, bindingResult);
        var valResp = handler.handleValidationException(valEx, request);
        assertEquals(400, valResp.getStatusCode().value());
        assertTrue(Objects.requireNonNull(valResp.getBody()).getMessage().contains("Email không hợp lệ"));
        assertTrue(Objects.requireNonNull(valResp.getBody()).getMessage().contains("Mật khẩu quá ngắn"));
        assertNotNull(valResp.getBody().getErrors());
        assertEquals("Email không hợp lệ", valResp.getBody().getErrors().get("email"));
        assertEquals("Mật khẩu quá ngắn", valResp.getBody().getErrors().get("password"));
    }

    @Test
    void testRoleBasedAccessControlAndPermissions() throws Exception {
        MemberDto adminLogin = schoolService.login(new LoginRequestDto("admin@gmail.com", "admin123"));
        assertEquals("admin", adminLogin.getRole());
        assertEquals("Quản trị viên", adminLogin.getName());

        assertFalse(schoolService.getAllClasses().isEmpty());
        assertFalse(schoolService.getAllMembers().isEmpty());

        GradeDto adminGradeUpdate = GradeDto.builder()
                .studentId(hs1.getId())
                .studentCode("HS001")
                .math(9.0)
                .math_oral(9.0)
                .math_m15(9.0)
                .math_mid(9.0)
                .math_final(9.0)
                .literature(8.5)
                .literature_oral(8.5)
                .literature_m15(8.5)
                .literature_mid(8.5)
                .literature_final(8.5)
                .english(9.5)
                .english_oral(9.5)
                .english_m15(9.5)
                .english_mid(9.5)
                .english_final(9.5)
                .updatedBy("AD001")
                .build();
        GradeDto savedByAdmin = schoolService.saveGrade("HS001", adminGradeUpdate);
        assertEquals(9.0, savedByAdmin.getMath());
        assertEquals(8.5, savedByAdmin.getLiterature());
        assertEquals(9.5, savedByAdmin.getEnglish());
        double calculatedAdminGpa = (savedByAdmin.getMath() + savedByAdmin.getLiterature() + savedByAdmin.getEnglish()) / 3.0;
        assertEquals(9.0, Math.round(calculatedAdminGpa * 100.0) / 100.0);

        MemberDto teacherLogin = schoolService.login(new LoginRequestDto("gv01@edu.com", "teacher123"));
        assertEquals("teacher", teacherLogin.getRole());
        assertEquals("math", teacherLogin.getSubject());
        assertTrue(teacherLogin.getAssignedClasses().contains("10A1"));

        PageResponse<MemberDto> teacherStudentsPage = schoolService.getMembersResponse(1, 10, "student", null, "10A1", "GV01");
        assertNotNull(teacherStudentsPage.getContent());
        assertTrue(teacherStudentsPage.getContent().stream().allMatch(s -> "10A1".equals(s.getClassName()) || "GV01".equals(s.getCode())));

        GradeDto teacherMathUpdate = GradeDto.builder()
                .studentId(hs1.getId())
                .studentCode("HS001")
                .math_oral(10.0)
                .math_m15(10.0)
                .math_mid(10.0)
                .math_final(10.0)
                .literature(2.0)
                .english(2.0)
                .updatedBy("GV01")
                .build();
        schoolService.saveGrade("HS001", teacherMathUpdate);

        Grade updatedGrade = gradeRepository.findByStudentCodeIgnoreCase("HS001").orElseThrow();
        assertEquals(10.0, updatedGrade.getMath());
        assertEquals(8.5, updatedGrade.getLiterature());
        assertEquals(9.5, updatedGrade.getEnglish());

        Map<String, Object> teacherGradeView = schoolService.getStudentGradeRecord("HS001", "GV01");
        assertEquals("HS001", teacherGradeView.get("studentId"));
        assertEquals(10.0, teacherGradeView.get("math"));
        assertNull(teacherGradeView.get("literature"));
        assertNull(teacherGradeView.get("english"));

        MemberDto studentLogin = schoolService.login(new LoginRequestDto("hs01@gmail.com", "student123"));
        assertEquals("student", studentLogin.getRole());
        assertEquals("10A1", studentLogin.getClassName());

        mockMvc.perform(get("/api/grades/HS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value("HS001"))
                .andExpect(jsonPath("$.math").value(10.0))
                .andExpect(jsonPath("$.literature").value(8.5))
                .andExpect(jsonPath("$.english").value(9.5))
                .andExpect(jsonPath("$.gpa").value(9.33));

        mockMvc.perform(get("/api/members/HS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("HS001"))
                .andExpect(jsonPath("$.role").value("student"))
                .andExpect(jsonPath("$.className").value("10A1"));
    }
}
