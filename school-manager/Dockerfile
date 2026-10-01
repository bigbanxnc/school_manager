# Stage 1: Build ứng dụng với Java 21
FROM amazoncorretto:21 AS build
WORKDIR /app
RUN yum install -y tar gzip
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw package -DskipTests

# Stage 2: Runtime siêu nhẹ với Java 21 Alpine
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]