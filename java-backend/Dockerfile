FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/target/visualizer-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 3001

CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-3001}"]
