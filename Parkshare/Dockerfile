# Use an official Maven + JDK image to build the app
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Use a slim JDK runtime image to run the app
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE $PORT
ENTRYPOINT ["java", "-jar", "app.jar"]
