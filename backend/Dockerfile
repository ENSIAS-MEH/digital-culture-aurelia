FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q
# Extract the PostgreSQL JDBC jar from local Maven repo for WildFly module
RUN find /root/.m2 -name "postgresql-*.jar" \
      ! -name "*javadoc*" ! -name "*sources*" \
      | head -1 | xargs -I{} cp {} /postgresql.jar

FROM quay.io/wildfly/wildfly:31.0.0.Final-jdk17
COPY --from=build /app/target/aurelia.war /opt/jboss/wildfly/standalone/deployments/
COPY --from=build /postgresql.jar /opt/postgresql.jar
COPY docker/entrypoint.sh /opt/entrypoint.sh
USER root
RUN chmod +x /opt/entrypoint.sh
USER jboss
EXPOSE 8080
CMD ["/opt/entrypoint.sh"]
