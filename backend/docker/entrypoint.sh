#!/bin/bash
set -e

WILDFLY_HOME=/opt/jboss/wildfly
PG_MODULE_DIR="$WILDFLY_HOME/modules/system/layers/base/org/postgresql/main"

# ── Install PostgreSQL module ──────────────────────────────────────────────────
mkdir -p "$PG_MODULE_DIR"
cp /opt/postgresql.jar "$PG_MODULE_DIR/postgresql.jar"

cat > "$PG_MODULE_DIR/module.xml" << 'XML'
<?xml version="1.0" encoding="UTF-8"?>
<module xmlns="urn:jboss:module:1.3" name="org.postgresql">
    <resources>
        <resource-root path="postgresql.jar"/>
    </resources>
    <dependencies>
        <module name="javax.api"/>
        <module name="javax.transaction.api"/>
    </dependencies>
</module>
XML

# ── Start WildFly in background ────────────────────────────────────────────────
"$WILDFLY_HOME/bin/standalone.sh" -b 0.0.0.0 -bmanagement 0.0.0.0 &
WILDFLY_PID=$!

echo "Waiting for WildFly management interface..."
until "$WILDFLY_HOME/bin/jboss-cli.sh" --connect --command="ls" > /dev/null 2>&1; do
    sleep 3
done
echo "WildFly is up — configuring datasource..."

# ── Configure JDBC driver + datasource ────────────────────────────────────────
"$WILDFLY_HOME/bin/jboss-cli.sh" --connect << EOF
/subsystem=datasources/jdbc-driver=postgresql:add(driver-name=postgresql,driver-module-name=org.postgresql,driver-class-name=org.postgresql.Driver)
data-source add \
  --name=AureliaDS \
  --jndi-name=java:jboss/datasources/AureliaDS \
  --driver-name=postgresql \
  --connection-url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \
  --user-name=${DB_USER} \
  --password=${DB_PASSWORD} \
  --min-pool-size=5 \
  --max-pool-size=20 \
  --enabled=true
:reload
EOF

echo "Datasource configured. WildFly running."
wait $WILDFLY_PID
