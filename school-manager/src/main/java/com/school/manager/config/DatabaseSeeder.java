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

            long memberCount = memberRepo.count();
            long classCount = classRepo.count();
            if (memberCount > 0 || classCount > 0) {
                log.info("[DB Seeder] Cơ sở dữ liệu đã có sẵn dữ liệu ({} thành viên, {} lớp học). Giữ nguyên dữ liệu hiện tại.",
                        memberCount, classCount);
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

                if (dbData.getGrades() != null) {
                    List<Grade> validGrades = new ArrayList<>();
                    for (RawGrade rg : dbData.getGrades()) {
                        String studentCode = resolveStudentCode(rg);
                        if (studentCode == null) {
                            continue;
                        }

                        String studentCodeUpper = studentCode.toUpperCase();
                        Grade g = Grade.builder()
                                .studentId(studentCodeUpper)
                                .studentCode(studentCodeUpper)
                                .build();
                        copyScoresFromRawGrade(g, rg);
                        // Đồng bộ tính toán điểm qua ScoreUtil
                        if (g.getMath_oral() == null && rg.getMath() != null) {
                            g.setMath(rg.getMath());
                            g.setLiterature(rg.getLiterature());
                            g.setEnglish(rg.getEnglish());
                            g.setGpa(rg.getGpa());
                        } else {
                            g.calculateDerivedScores();
                        }
                        validGrades.add(g);
                    }
                    gradeRepo.saveAll(validGrades);
                    log.info("[DB Seeder] Đã nạp {} điểm số của học sinh.", validGrades.size());
                }
                List<Member> students = memberRepo.findByRole("student");
                List<Grade> missingGrades = new ArrayList<>();
                for (Member s : students) {
                    boolean gradeExists = (s.getCode() != null && gradeRepo.existsByStudentCodeIgnoreCase(s.getCode()))
                            || (s.getId() != null && gradeRepo.existsByStudentId(s.getId()));
                    if (!gradeExists) {
                        String sCode = (s.getCode() != null && !s.getCode().trim().isEmpty())
                                ? s.getCode().trim().toUpperCase()
                                : (s.getId() != null ? String.valueOf(s.getId()) : null);
                        if (sCode != null) {
                            missingGrades.add(Grade.builder()
                                    .studentId(sCode)
                                    .studentCode(sCode)
                                    .build());
                        }
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

    private String resolveStudentCode(RawGrade rg) {
        String studentCode = rg.getStudentId();
        if (studentCode == null || studentCode.trim().isEmpty()) {
            studentCode = rg.getId();
        }
        return (studentCode != null && !studentCode.trim().isEmpty()) ? studentCode.trim() : null;
    }

    private void copyScoresFromRawGrade(Grade target, RawGrade source) {
        target.setMath_oral(source.getMathOral());
        target.setMath_m15(source.getMathM15());
        target.setMath_mid(source.getMathMid());
        target.setMath_final(source.getMathFinal());
        target.setLiterature_oral(source.getLiteratureOral());
        target.setLiterature_m15(source.getLiteratureM15());
        target.setLiterature_mid(source.getLiteratureMid());
        target.setLiterature_final(source.getLiteratureFinal());
        target.setEnglish_oral(source.getEnglishOral());
        target.setEnglish_m15(source.getEnglishM15());
        target.setEnglish_mid(source.getEnglishMid());
        target.setEnglish_final(source.getEnglishFinal());
    }

    private String resolveDefaultPassword(String rawPassword, String role) {
        if (rawPassword != null && !rawPassword.trim().isEmpty()) {
            return rawPassword;
        }
        return switch (role != null ? role.trim().toLowerCase() : "") {
            case "admin" -> "admin123";
            case "teacher" -> "teacher123";
            default -> "hs123";
        };
    }
}
