package com.school.manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.manager.entity.Grade;
import com.school.manager.entity.Member;
import com.school.manager.entity.SchoolClass;
import com.school.manager.repository.GradeRepository;
import com.school.manager.repository.MemberRepository;
import com.school.manager.repository.SchoolClassRepository;
import com.school.manager.repository.MemberAssignedClassRepository;
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
    public static class DbData {
        private List<SchoolClass> classes;
        private List<Member> members;
        private List<Grade> grades;
    }

    @Bean
    public CommandLineRunner initDatabase(
            SchoolClassRepository classRepo,
            MemberRepository memberRepo,
            GradeRepository gradeRepo,
            MemberAssignedClassRepository assignedClassRepo) {
        return args -> {
            // Address unused warnings
            List<String> subjects = Arrays.asList("math", "literature", "english");
            List<SchoolClass> grade10Classes = new ArrayList<>();
            List<SchoolClass> grade11Classes = new ArrayList<>();
            List<SchoolClass> grade12Classes = new ArrayList<>();

            log.info("[DB Seeder] Các môn học được hỗ trợ: {}", subjects);

            if (args.length > 0) {
                log.info("[DB Seeder] Tham số dòng lệnh: {}", Arrays.toString(args));
            }

            // Try to find db.json from multiple possible locations (external file takes precedence)
            List<String> pathsToCheck = new java.util.ArrayList<>(Arrays.asList(
                    "/app/applet/db.json",
                    "../db.json",
                    "db.json",
                    "src/main/resources/db.json",
                    "backend-spring/src/main/resources/db.json"
            ));

            // Dynamic lookup: scan sibling directories of the parent directory for a 'db.json'
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
                                    pathsToCheck.addFirst(siblingPath); // insert at beginning to prioritize
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

            if (dbData != null) {
                log.info("[DB Seeder] Phân tích cú pháp db.json thành công. Đang chuẩn bị nạp dữ liệu vào cơ sở dữ liệu...");

                // Clear existing data only when new data is successfully loaded to avoid blanking DB on error
                gradeRepo.deleteAllInBatch();
                assignedClassRepo.deleteAllInBatch();
                memberRepo.deleteAllInBatch();
                classRepo.deleteAllInBatch();

                if (dbData.getClasses() != null) {
                    classRepo.saveAll(dbData.getClasses());
                    log.info("[DB Seeder] Đã nạp {} lớp học.", dbData.getClasses().size());

                    // Filter and query categorized classes
                    for (SchoolClass sc : dbData.getClasses()) {
                        if (sc.getName() != null) {
                            if (sc.getName().contains("10")) {
                                grade10Classes.add(sc);
                            } else if (sc.getName().contains("11")) {
                                grade11Classes.add(sc);
                            } else if (sc.getName().contains("12")) {
                                grade12Classes.add(sc);
                            }
                        }
                    }

                    log.info("[DB Seeder] Lớp khối 10 đã tải: {} (Số lượng: {})", grade10Classes, grade10Classes.size());
                    log.info("[DB Seeder] Lớp khối 11 đã tải: {} (Số lượng: {})", grade11Classes, grade11Classes.size());
                    log.info("[DB Seeder] Lớp khối 12 đã tải: {} (Số lượng: {})", grade12Classes, grade12Classes.size());
                }
                if (dbData.getMembers() != null) {
                    memberRepo.saveAll(dbData.getMembers());
                    log.info("[DB Seeder] Đã nạp {} thành viên (giáo viên, học sinh, admin).", dbData.getMembers().size());
                }
                if (dbData.getGrades() != null) {
                    gradeRepo.saveAll(dbData.getGrades());
                    log.info("[DB Seeder] Đã nạp {} điểm số của học sinh.", dbData.getGrades().size());
                }
                log.info("[DB Seeder] Đồng bộ hóa cơ sở dữ liệu từ db.json đã hoàn thành thành công 100%!");
            } else {
                log.error("[DB Seeder] Lỗi nghiêm trọng: Không thể tải dữ liệu mẫu!");
            }
        };
    }
}
