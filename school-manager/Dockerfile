# Giai đoạn 1: Build ứng dụng trực tiếp trong container bằng JDK 26
FROM amazoncorretto:26 AS build
WORKDIR /app

# Cài đặt tar và gzip để giải nén Maven Wrapper
RUN yum install -y tar gzip

# Copy cấu hình Maven và mã nguồn từ máy bạn vào container
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests

# Giai đoạn 2: Tạo image chạy thực tế gọn nhẹ bằng Alpine
FROM amazoncorretto:26-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]