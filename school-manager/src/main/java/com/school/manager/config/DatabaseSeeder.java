package com.school.manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import com.school.manager.entity.SchoolClass;
import com.school.manager.repository.GradeRepository;
import com.school.manager.repository.MemberRepository;
import com.school.manager.repository.SchoolClassRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@Slf4j
public class DatabaseSeeder {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawClass {
        private String id;
        private String code;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawMember {
        private String id;
        private String code;
        private String name;
        private String email;
        private String password;
        private String role;
        @com.fasterxml.jackson.annotation.JsonProperty("className")
        private String className;
        private String subject;
        @com.fasterxml.jackson.annotation.JsonProperty("assignedClasses")
        private List<String> assignedClasses;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawGrade {
        private String id;
        @com.fasterxml.jackson.annotation.JsonProperty("studentId")
        private String studentId;
        private Double math;
        private Double literature;
        private Double english;

        @com.fasterxml.jackson.annotation.JsonAlias({"math_oral", "mathOral"})
        private Double mathOral;

        @com.fasterxml.jackson.annotation.JsonAlias({"math_m15", "mathM15"})
        private Double mathM15;

        @com.fasterxml.jackson.annotation.JsonAlias({"math_mid", "mathMid"})
        private Double mathMid;

        @com.fasterxml.jackson.annotation.JsonAlias({"math_final", "mathFinal"})
        private Double mathFinal;

        @com.fasterxml.jackson.annotation.JsonAlias({"literature_oral", "literatureOral"})
        private Double literatureOral;

        @com.fasterxml.jackson.annotation.JsonAlias({"literature_m15", "literatureM15"})
        private Double literatureM15;

        @com.fasterxml.jackson.annotation.JsonAlias({"literature_mid", "literatureMid"})
        private Double literatureMid;

        @com.fasterxml.jackson.annotation.JsonAlias({"literature_final", "literatureFinal"})
        private Double literatureFinal;

        @com.fasterxml.jackson.annotation.JsonAlias({"english_oral", "englishOral"})
        private Double englishOral;

        @com.fasterxml.jackson.annotation.JsonAlias({"english_m15", "englishM15"})
        private Double englishM15;

        @com.fasterxml.jackson.annotation.JsonAlias({"english_mid", "englishMid"})
        private Double englishMid;

        @com.fasterxml.jackson.annotation.JsonAlias({"english_final", "englishFinal"})
        private Double englishFinal;

        private Double gpa;
        private String academicPerformance;
        private String updatedBy;
        private String updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class DbData {
        private List<RawClass> classes;
        private List<RawMember> members;
        private List<RawGrade> grades;
    }

    @Bean
    public CommandLineRunner initDatabase(
            SchoolClassRepository classRepo,
            MemberRepository memberRepo,
            GradeRepository gradeRepo) {
        return args -> {
            List<String> subjects = Arrays.asList("math", "literature", "english");
            log.info("[DB Seeder] Các môn học được hỗ trợ: {}", subjects);

            if (args.length > 0) {
                log.info("[DB Seeder] Tham số dòng lệnh: {}", Arrays.toString(args));
            }

            List<String> pathsToCheck = new java.util.ArrayList<>(Arrays.asList(
                    "/app/applet/db.json",
                    "../db.json",
                    "db.json",
                    "src/main/resources/db.json",
                    "backend-spring/src/main/resources/db.json"
            ));

            try {
                File currentDir = new File(".").getCanonicalFile();
                File parentDir = currentDir.getParentFile();
                if (parentDir != null && parentDir.exists()) {
                    File[] siblings = parentDir.listFiles();
                    if (siblings != null) {
                        for (File sibling : siblings) {
                            if (sibling.isDirectory()) {
                                File testFile = new File(sibling, "db.json");
                                if (testFile.exists()) {
                                    String siblingPath = testFile.getPath();
                                    log.info("[DB Seeder] Phát hiện động file db.json trong thư mục cùng cấp: {}", siblingPath);
                                    pathsToCheck.addFirst(siblingPath);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("[DB Seeder] Lưu ý: Lỗi khi quét các thư mục cùng cấp để tìm db.json: {}", e.getMessage());
            }

            File dbFile = null;
            for (String path : pathsToCheck) {
                File temp = new File(path);
                if (temp.exists()) {
                    dbFile = temp;
                    break;
                }
            }

            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            DbData dbData = null;

            if (dbFile != null) {
                log.info("[DB Seeder] Đang tải dữ liệu từ file: {}", dbFile.getAbsolutePath());
                try {
                    dbData = mapper.readValue(dbFile, DbData.class);
                } catch (Exception e) {
                    log.error("[DB Seeder] Lỗi khi phân tích cú pháp file db.json: {}", e.getMessage(), e);
                }
            } else {
                log.info("[DB Seeder] Không tìm thấy file db.json bên ngoài tại các đường dẫn có thể: {}. Đang thử từ tài nguyên classpath.", pathsToCheck);
                try {
                    org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("db.json");
                    if (resource.exists()) {
                        try (InputStream is = resource.getInputStream()) {
                            dbData = mapper.readValue(is, DbData.class);
                            log.info("[DB Seeder] Tải thành công dữ liệu từ tài nguyên classpath db.json!");
                        }
                    } else {
                        try (InputStream is = DatabaseSeeder.class.getClassLoader().getResourceAsStream("db.json")) {
                            if (is != null) {
                                dbData = mapper.readValue(is, DbData.class);
                                log.info("[DB Seeder] Tải thành công dữ liệu từ tài nguyên classpath db.json qua ClassLoader!");
                            } else {
                                log.warn("[DB Seeder] Không tìm thấy file db.json. Bỏ qua quá trình nạp dữ liệu mẫu.");
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("[DB Seeder] Lỗi khi phân tích cú pháp tài nguyên classpath: {}", e.getMessage(), e);
                }
            }

            if (memberRepo.count() > 0 || classRepo.count() > 0) {
                log.info("[DB Seeder] Cơ sở dữ liệu đã có sẵn dữ liệu ({} thành viên, {} lớp học). Giữ nguyên dữ liệu hiện tại.",
                        memberRepo.count(), classRepo.count());

                // Tự động kiểm tra và mã hóa toàn bộ mật khẩu cũ chưa băm (như hs123, teacher123) sang SHA-1
                List<Member> unhashedMembers = new ArrayList<>();
                for (Member m : memberRepo.findAll()) {
                    boolean modified = false;
                    if (m.getPassword() != null && !com.school.manager.util.PasswordUtil.isSha1(m.getPassword())) {
                        m.setPassword(com.school.manager.util.PasswordUtil.ensureSha1(m.getPassword()));
                        modified = true;
                    }
                    if (m.getMustChangePassword() == null) {
                        m.setMustChangePassword(false);
                        modified = true;
                    }
                    if (modified) {
                        unhashedMembers.add(m);
                    }
                }
                if (!unhashedMembers.isEmpty()) {
                    memberRepo.saveAll(unhashedMembers);
                    log.info("[DB Seeder] Đã tự động băm SHA-1 cho {} tài khoản chưa được mã hóa!", unhashedMembers.size());
                }

                // Tự động kiểm tra và cập nhật các điểm phụ (miệng, 15p, giữa kỳ, cuối kỳ) và studentCode nếu đang bị NULL
                if (dbData != null && dbData.getGrades() != null && gradeRepo.count() > 0) {
                    boolean hasMissingData = gradeRepo.findAll().stream()
                            .anyMatch(g -> (g.getMath() != null && g.getMath_oral() == null) || g.getStudentCode() == null);
                    if (hasMissingData) {
                        log.info("[DB Seeder] Đang tự động bổ sung studentCode và dữ liệu điểm thành phần từ db.json...");
                        java.util.Map<String, Long> codeToSid = new java.util.HashMap<>();
                        for (Member m : memberRepo.findAll()) {
                            if (m.getCode() != null && m.getId() != null) {
                                codeToSid.put(m.getCode().trim().toLowerCase(), m.getId());
                            }
                        }
                        java.util.Map<String, Grade> existingGradeMap = new java.util.HashMap<>();
                        for (Grade g : gradeRepo.findAll()) {
                            if (g.getStudentId() != null) {
                                existingGradeMap.put(g.getStudentId().trim().toLowerCase(), g);
                            }
                            if (g.getStudentCode() != null) {
                                existingGradeMap.put(g.getStudentCode().trim().toLowerCase(), g);
                            }
                        }
                        List<Grade> toUpdate = new ArrayList<>();
                        for (RawGrade rg : dbData.getGrades()) {
                            String studentCode = rg.getStudentId();
                            if (studentCode == null || studentCode.trim().isEmpty()) {
                                studentCode = rg.getId();
                            }
                            if (studentCode != null) {
                                String cleanCode = studentCode.trim().toLowerCase();
                                Grade eg = existingGradeMap.get(cleanCode);
                                if (eg == null) {
                                    Long sid = codeToSid.get(cleanCode);
                                    if (sid != null) {
                                        eg = existingGradeMap.get(String.valueOf(sid));
                                    }
                                }
                                if (eg != null) {
                                    boolean modified = false;
                                    if (eg.getStudentCode() == null) {
                                        eg.setStudentCode(studentCode.trim().toUpperCase());
                                        modified = true;
                                    }
                                    if (eg.getMath_oral() == null && rg.getMathOral() != null) {
                                        eg.setMath_oral(rg.getMathOral());
                                        eg.setMath_m15(rg.getMathM15());
                                        eg.setMath_mid(rg.getMathMid());
                                        eg.setMath_final(rg.getMathFinal());
                                        eg.setLiterature_oral(rg.getLiteratureOral());
                                        eg.setLiterature_m15(rg.getLiteratureM15());
                                        eg.setLiterature_mid(rg.getLiteratureMid());
                                        eg.setLiterature_final(rg.getLiteratureFinal());
                                        eg.setEnglish_oral(rg.getEnglishOral());
                                        eg.setEnglish_m15(rg.getEnglishM15());
                                        eg.setEnglish_mid(rg.getEnglishMid());
                                        eg.setEnglish_final(rg.getEnglishFinal());
                                        if (eg.getGpa() == null) {
                                            eg.setGpa(rg.getGpa());
                                        }
                                        modified = true;
                                    }
                                    if (modified) {
                                        toUpdate.add(eg);
                                    }
                                }
                            }
                        }
                        if (!toUpdate.isEmpty()) {
                            gradeRepo.saveAll(toUpdate);
                            log.info("[DB Seeder] Đã bổ sung thành công studentCode và điểm phụ cho {} bản ghi học sinh!", toUpdate.size());
                        }
                    }
                }
                return;
            }

            if (dbData != null) {
                log.info("[DB Seeder] Cơ sở dữ liệu trống. Đang chuẩn bị nạp dữ liệu ban đầu vào cơ sở dữ liệu...");

                if (dbData.getClasses() != null) {
                    List<SchoolClass> entityClasses = new ArrayList<>();
                    for (RawClass rc : dbData.getClasses()) {
                        String code = rc.getCode();
                        if (code == null || code.trim().isEmpty()) {
                            code = rc.getId();
                        }
                        if (code == null || code.trim().isEmpty()) {
                            code = "CLASS" + (System.currentTimeMillis() % 100000);
                        }
                        code = code.trim().toUpperCase();
                        String name = rc.getName();
                        if (name == null || name.trim().isEmpty()) {
                            name = "Lớp " + code;
                        }
                        SchoolClass sc = SchoolClass.builder()
                                .code(code)
                                .name(name.trim())
                                .build();
                        entityClasses.add(sc);
                    }
                    classRepo.saveAll(entityClasses);
                    log.info("[DB Seeder] Đã nạp {} lớp học.", entityClasses.size());
                }
                if (dbData.getMembers() != null) {
                    List<Member> entityMembers = new ArrayList<>();
                    for (RawMember rm : dbData.getMembers()) {
                        if (rm != null) {
                            String memberCode = rm.getCode();
                            if (memberCode == null || memberCode.trim().isEmpty()) {
                                memberCode = rm.getId();
                            }
                            if (memberCode == null || memberCode.trim().isEmpty()) {
                                memberCode = "M" + (System.currentTimeMillis() % 100000);
                            }
                            memberCode = memberCode.trim().toUpperCase();

                            String role = rm.getRole();
                            if (role == null || role.trim().isEmpty()) {
                                role = "student";
                            }
                            role = role.trim();

                            String email = rm.getEmail();
                            if (email == null || email.trim().isEmpty()) {
                                email = memberCode.toLowerCase() + "@school.com";
                            }

                            String password = com.school.manager.util.PasswordUtil.ensureSha1(resolveDefaultPassword(rm.getPassword(), role));

                            String name = rm.getName();
                            if (name == null || name.trim().isEmpty()) {
                                name = "Thành viên " + memberCode;
                            }

                            Member m = Member.builder()
                                    .code(memberCode)
                                    .name(name.trim())
                                    .email(email.trim().toLowerCase())
                                    .password(password)
                                    .role(role)
                                    .className(rm.getClassName())
                                    .subject(rm.getSubject())
                                    .assignedClasses(rm.getAssignedClasses() != null ? rm.getAssignedClasses() : new ArrayList<>())
                                    .build();
                            entityMembers.add(m);
                        }
                    }
                    memberRepo.saveAll(entityMembers);
                    log.info("[DB Seeder] Đã nạp {} thành viên (giáo viên, học sinh, admin).", entityMembers.size());
                }

                java.util.Map<String, Long> codeToStudentId = new java.util.HashMap<>();
                for (Member m : memberRepo.findAll()) {
                    if (m.getCode() != null && m.getId() != null) {
                        codeToStudentId.put(m.getCode().toLowerCase(), m.getId());
                    }
                }

                if (dbData.getGrades() != null) {
                    List<Grade> validGrades = new ArrayList<>();
                    for (RawGrade rg : dbData.getGrades()) {
                        String studentCode = rg.getStudentId();
                        if (studentCode == null || studentCode.trim().isEmpty()) {
                            studentCode = rg.getId();
                        }
                        Long sid = null;
                        if (studentCode != null) {
                            sid = codeToStudentId.get(studentCode.trim().toLowerCase());
                        }
                        if (sid != null) {
                            Grade g = Grade.builder()
                                    .studentId(sid)
                                    .studentCode(studentCode.trim().toUpperCase())
                                    .math(rg.getMath())
                                    .literature(rg.getLiterature())
                                    .english(rg.getEnglish())
                                    .math_oral(rg.getMathOral())
                                    .math_m15(rg.getMathM15())
                                    .math_mid(rg.getMathMid())
                                    .math_final(rg.getMathFinal())
                                    .literature_oral(rg.getLiteratureOral())
                                    .literature_m15(rg.getLiteratureM15())
                                    .literature_mid(rg.getLiteratureMid())
                                    .literature_final(rg.getLiteratureFinal())
                                    .english_oral(rg.getEnglishOral())
                                    .english_m15(rg.getEnglishM15())
                                    .english_mid(rg.getEnglishMid())
                                    .english_final(rg.getEnglishFinal())
                                    .gpa(rg.getGpa())
                                    .build();
                            validGrades.add(g);
                        }
                    }
                    gradeRepo.saveAll(validGrades);
                    log.info("[DB Seeder] Đã nạp {} điểm số của học sinh.", validGrades.size());
                }
                List<Member> students = memberRepo.findByRole("student");
                List<Grade> missingGrades = new ArrayList<>();
                for (Member s : students) {
                    if (s.getId() != null && !gradeRepo.existsByStudentId(s.getId())) {
                        missingGrades.add(Grade.builder().studentId(s.getId()).studentCode(s.getCode()).build());
                    }
                }
                if (!missingGrades.isEmpty()) {
                    gradeRepo.saveAll(missingGrades);
                    log.info("[DB Seeder] Đã khởi tạo bản ghi điểm cho {} học sinh chưa có điểm.", missingGrades.size());
                }
                log.info("[DB Seeder] Đồng bộ hóa cơ sở dữ liệu từ db.json đã hoàn thành thành công 100%!");
            } else {
                log.error("[DB Seeder] Lỗi nghiêm trọng: Không thể tải dữ liệu mẫu!");
            }
        };
    }

    private String resolveDefaultPassword(String rawPassword, String role) {
        if (rawPassword != null && !rawPassword.trim().isEmpty()) {
            return rawPassword;
        }
        if ("admin".equalsIgnoreCase(role)) {
            return "admin123";
        } else if ("teacher".equalsIgnoreCase(role)) {
            return "teacher123";
        }
        return "hs123";
    }
}
