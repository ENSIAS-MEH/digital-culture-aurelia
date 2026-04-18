package com.aurelia.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;

@Singleton
@Startup
public class FlywayStartup {

    @Resource(lookup = "java:jboss/datasources/AureliaDS")
    private DataSource dataSource;

    @PostConstruct
    void migrate() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .outOfOrder(false)
                .load();
        flyway.migrate();
    }
}
