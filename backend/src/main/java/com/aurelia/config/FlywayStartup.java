package com.aurelia.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.ejb.TransactionManagement;
import jakarta.ejb.TransactionManagementType;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;

@Singleton
@Startup
@TransactionManagement(TransactionManagementType.BEAN)
public class FlywayStartup {

    @Resource(lookup = "java:jboss/datasources/AureliaDS")
    private DataSource dataSource;

    @PostConstruct
    @TransactionAttribute(TransactionAttributeType.NOT_SUPPORTED)
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
