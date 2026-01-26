# Disaster Recovery and Business Continuity Guide

This guide provides procedures and recommendations for implementing disaster recovery (DR) and business continuity (BC) for VerifyWise deployments.

---

## Overview

VerifyWise is designed to integrate with your organization's existing DR/BC infrastructure. This guide covers:

- Recovery objectives and planning
- Database backup and restore procedures
- High-availability deployment options
- PostgreSQL replication configuration
- Redis persistence and recovery
- Recovery runbooks

---

## 1. Recovery objectives

### Defining RTO and RPO

| Metric | Definition | Considerations |
|--------|------------|----------------|
| **RTO** (Recovery Time Objective) | Maximum acceptable downtime | Depends on business criticality |
| **RPO** (Recovery Point Objective) | Maximum acceptable data loss | Determines backup frequency |

### Recommended targets by deployment tier

| Tier | RTO | RPO | Backup strategy |
|------|-----|-----|-----------------|
| Development | 24 hours | 24 hours | Daily backups |
| Standard | 4 hours | 1 hour | Hourly backups |
| Enterprise | 1 hour | 15 minutes | Continuous replication |
| Mission-critical | 15 minutes | Near-zero | Synchronous replication |

---

## 2. Data architecture

### Components requiring backup

| Component | Data type | Criticality | Backup method |
|-----------|-----------|-------------|---------------|
| PostgreSQL | Application data, user data, compliance records | Critical | pg_dump, streaming replication, PITR |
| Redis | Job queues, session cache | Medium | RDB snapshots, AOF persistence |
| File uploads | Evidence files, attachments | High | Volume snapshots, object storage sync |
| Configuration | Environment variables, secrets | Critical | Secrets manager, version control |

### Data flow diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        VerifyWise Data Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │              │
│  │   (React)   │     │  (Express)  │     │   Primary   │              │
│  └─────────────┘     └──────┬──────┘     └──────┬──────┘              │
│                             │                    │                     │
│                             │                    │ Streaming           │
│                             ▼                    │ Replication         │
│                      ┌─────────────┐            ▼                     │
│                      │    Redis    │     ┌─────────────┐              │
│                      │   (Cache)   │     │  PostgreSQL │              │
│                      └─────────────┘     │   Standby   │              │
│                             │            └─────────────┘              │
│                             │                                         │
│                             ▼                                         │
│                      ┌─────────────┐                                  │
│                      │   Worker    │                                  │
│                      │ (BullMQ)    │                                  │
│                      └─────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database backup procedures

### 3.1 Full database backup

#### Docker Compose environment

```bash
#!/bin/bash
# Full backup script for Docker Compose deployment
# Save as: /opt/verifywise/scripts/backup-full.sh

set -e

BACKUP_DIR="/var/backups/verifywise"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/verifywise_full_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create backup
echo "Starting full backup at $(date)"
docker compose exec -T postgresdb pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
  echo "Backup completed: ${BACKUP_FILE}"
  echo "Size: $(ls -lh ${BACKUP_FILE} | awk '{print $5}')"
else
  echo "ERROR: Backup failed or empty"
  exit 1
fi

# Clean old backups
find "${BACKUP_DIR}" -name "verifywise_full_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Cleaned backups older than ${RETENTION_DAYS} days"
```

#### Kubernetes environment

```bash
#!/bin/bash
# Full backup script for Kubernetes deployment
# Save as: backup-k8s.sh

NAMESPACE="verifywise"
POD=$(kubectl get pods -n ${NAMESPACE} -l component=database -o jsonpath='{.items[0].metadata.name}')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="verifywise_full_${TIMESTAMP}.sql.gz"

# Create backup
kubectl exec -n ${NAMESPACE} ${POD} -- \
  pg_dump -U postgres verifywise \
  | gzip > "${BACKUP_FILE}"

echo "Backup saved to: ${BACKUP_FILE}"
```

### 3.2 Incremental backup with WAL archiving

For point-in-time recovery (PITR), enable WAL archiving:

**PostgreSQL configuration (postgresql.conf):**

```ini
# WAL archiving for PITR
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300  # Archive every 5 minutes if no activity

# For better recovery options
max_wal_senders = 3
wal_keep_size = 1GB
```

**Docker Compose with WAL archiving:**

```yaml
services:
  postgresdb:
    image: postgres:16.8
    volumes:
      - db:/var/lib/postgresql/data
      - wal_archive:/var/lib/postgresql/wal_archive
      - ./postgres-config/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

volumes:
  db:
  wal_archive:
```

### 3.3 Scheduled backup automation

**Cron configuration:**

```bash
# Edit crontab: crontab -e

# Full backup daily at 2:00 AM
0 2 * * * /opt/verifywise/scripts/backup-full.sh >> /var/log/verifywise-backup.log 2>&1

# Incremental backup every hour
0 * * * * /opt/verifywise/scripts/backup-incremental.sh >> /var/log/verifywise-backup.log 2>&1

# Verify backup integrity weekly
0 3 * * 0 /opt/verifywise/scripts/verify-backup.sh >> /var/log/verifywise-backup.log 2>&1
```

### 3.4 Backup verification

```bash
#!/bin/bash
# Verify backup integrity
# Save as: /opt/verifywise/scripts/verify-backup.sh

BACKUP_FILE=$1
TEST_DB="verifywise_test_restore"

# Create test database
docker compose exec -T postgresdb psql -U postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};"
docker compose exec -T postgresdb psql -U postgres -c "CREATE DATABASE ${TEST_DB};"

# Restore to test database
gunzip -c "${BACKUP_FILE}" | docker compose exec -T postgresdb psql -U postgres -d ${TEST_DB}

# Verify tables exist
TABLE_COUNT=$(docker compose exec -T postgresdb psql -U postgres -d ${TEST_DB} -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "${TABLE_COUNT}" -gt 0 ]; then
  echo "Backup verification PASSED: ${TABLE_COUNT} tables restored"
else
  echo "Backup verification FAILED: No tables found"
  exit 1
fi

# Cleanup
docker compose exec -T postgresdb psql -U postgres -c "DROP DATABASE ${TEST_DB};"
```

---

## 4. Database restore procedures

### 4.1 Full restore

```bash
#!/bin/bash
# Full restore procedure
# Save as: /opt/verifywise/scripts/restore-full.sh

BACKUP_FILE=$1

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

echo "WARNING: This will overwrite all data in the database."
echo "Backup file: ${BACKUP_FILE}"
read -p "Continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Stop application services
echo "Stopping application services..."
docker compose stop backend worker eval_server frontend

# Restore database
echo "Restoring database..."
gunzip -c "${BACKUP_FILE}" | docker compose exec -T postgresdb psql -U postgres -d verifywise

# Restart services
echo "Starting application services..."
docker compose start backend worker eval_server frontend

# Verify
echo "Verifying restore..."
docker compose exec -T postgresdb psql -U postgres -d verifywise -c "SELECT COUNT(*) FROM users;"

echo "Restore completed at $(date)"
```

### 4.2 Point-in-time recovery

```bash
#!/bin/bash
# Point-in-time recovery procedure
# Requires WAL archiving to be enabled

RECOVERY_TARGET_TIME=$1  # Format: '2024-01-15 14:30:00'

if [ -z "${RECOVERY_TARGET_TIME}" ]; then
  echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
  exit 1
fi

# Stop PostgreSQL
docker compose stop postgresdb

# Create recovery.signal and configure recovery
cat > postgres-recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '${RECOVERY_TARGET_TIME}'
recovery_target_action = 'promote'
EOF

# Copy recovery configuration
docker cp postgres-recovery.conf verifywise-postgresdb-1:/var/lib/postgresql/data/

# Create recovery signal
docker compose exec -T postgresdb touch /var/lib/postgresql/data/recovery.signal

# Start PostgreSQL in recovery mode
docker compose start postgresdb

echo "Recovery initiated to: ${RECOVERY_TARGET_TIME}"
echo "Monitor logs: docker compose logs -f postgresdb"
```

### 4.3 Selective table restore

```bash
#!/bin/bash
# Restore specific tables from backup

BACKUP_FILE=$1
TABLE_NAME=$2

# Extract single table
gunzip -c "${BACKUP_FILE}" | grep -A 1000000 "COPY public.${TABLE_NAME}" | \
  grep -B 1000000 "^\\\.$" | head -n -1 > table_data.sql

# Restore table
docker compose exec -T postgresdb psql -U postgres -d verifywise < table_data.sql

rm table_data.sql
```

---

## 5. PostgreSQL replication

### 5.1 Streaming replication setup

For high-availability deployments, configure PostgreSQL streaming replication.

**Primary server configuration (postgresql.conf):**

```ini
# Replication settings
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
hot_standby = on
synchronous_commit = on  # For synchronous replication
synchronous_standby_names = 'standby1'  # Name of standby server
```

**Primary server authentication (pg_hba.conf):**

```
# Allow replication connections from standby
host    replication     replicator    10.0.0.0/8    scram-sha-256
host    replication     replicator    172.16.0.0/12  scram-sha-256
```

**Create replication user:**

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_replication_password';
```

**Standby server setup:**

```bash
# Stop standby PostgreSQL
# Clear data directory
rm -rf /var/lib/postgresql/data/*

# Create base backup from primary
pg_basebackup -h primary-host -D /var/lib/postgresql/data \
  -U replicator -P -R -X stream -C -S standby1_slot

# Start standby PostgreSQL
```

**Standby configuration (postgresql.auto.conf - created by pg_basebackup):**

```ini
primary_conninfo = 'host=primary-host port=5432 user=replicator password=secure_replication_password application_name=standby1'
primary_slot_name = 'standby1_slot'
```

### 5.2 Docker Compose with replication

```yaml
version: '3.9'

services:
  postgres-primary:
    image: postgres:16.8
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-primary-data:/var/lib/postgresql/data
      - ./postgres-primary.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgres-standby:
    image: postgres:16.8
    environment:
      PGUSER: ${DB_USER}
      PGPASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-standby-data:/var/lib/postgresql/data
    depends_on:
      postgres-primary:
        condition: service_healthy
    # Note: Requires manual initialization with pg_basebackup

  backend:
    environment:
      DB_HOST: postgres-primary
      DB_READ_HOST: postgres-standby  # For read replicas (requires app support)

volumes:
  postgres-primary-data:
  postgres-standby-data:
```

### 5.3 Monitoring replication

```sql
-- On primary: Check replication status
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  sync_state
FROM pg_stat_replication;

-- On standby: Check recovery status
SELECT
  pg_is_in_recovery(),
  pg_last_wal_receive_lsn(),
  pg_last_wal_replay_lsn(),
  pg_last_xact_replay_timestamp();

-- Replication lag in bytes
SELECT
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;
```

---

## 6. Redis persistence and recovery

### 6.1 Redis persistence options

| Method | Description | RPO | Use case |
|--------|-------------|-----|----------|
| RDB | Point-in-time snapshots | Minutes | Default, good for backups |
| AOF | Append-only file logging | Seconds | Better durability |
| RDB + AOF | Combined | Seconds | Best durability |

### 6.2 Redis configuration for persistence

```conf
# redis.conf

# RDB snapshots
save 900 1      # Save if 1 key changed in 900 seconds
save 300 10     # Save if 10 keys changed in 300 seconds
save 60 10000   # Save if 10000 keys changed in 60 seconds

# AOF persistence
appendonly yes
appendfsync everysec  # Sync every second (balance of safety and performance)

# RDB file location
dbfilename dump.rdb
dir /data

# AOF file location
appendfilename "appendonly.aof"
```

### 6.3 Docker Compose with Redis persistence

```yaml
services:
  redis:
    image: redis:7
    command: redis-server --appendonly yes --appendfsync everysec
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
```

### 6.4 Redis backup

```bash
#!/bin/bash
# Redis backup script

BACKUP_DIR="/var/backups/verifywise/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

# Trigger RDB save
docker compose exec -T redis redis-cli BGSAVE

# Wait for save to complete
sleep 5

# Copy RDB file
docker cp verifywise-redis-1:/data/dump.rdb "${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

echo "Redis backup saved: ${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
```

---

## 7. High-availability deployment patterns

### 7.1 Single-node with managed services (recommended for most deployments)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Single-Node with Managed Services                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         ┌─────────────────┐                            │
│                         │  Load Balancer  │                            │
│                         │    (nginx)      │                            │
│                         └────────┬────────┘                            │
│                                  │                                      │
│              ┌───────────────────┼───────────────────┐                 │
│              │                   │                   │                 │
│              ▼                   ▼                   ▼                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│     │  Frontend   │     │   Backend   │     │   Worker    │          │
│     │  Container  │     │  Container  │     │  Container  │          │
│     └─────────────┘     └──────┬──────┘     └──────┬──────┘          │
│                                │                   │                   │
│              ┌─────────────────┴───────────────────┘                  │
│              │                                                         │
│              ▼                                                         │
│     ┌─────────────────────────────────────────────────────────┐       │
│     │              Managed Services (Cloud Provider)           │       │
│     │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │       │
│     │  │ PostgreSQL  │    │    Redis    │    │   Object    │ │       │
│     │  │    (RDS)    │    │(ElastiCache)│    │   Storage   │ │       │
│     │  └─────────────┘    └─────────────┘    └─────────────┘ │       │
│     └─────────────────────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Automated backups and point-in-time recovery
- Multi-AZ replication for database
- Automatic failover
- Reduced operational overhead

### 7.2 Multi-node Kubernetes deployment

```yaml
# High-availability backend deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: verifywise
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: verifywise
      component: backend
  template:
    metadata:
      labels:
        app: verifywise
        component: backend
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: component
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname
      containers:
      - name: backend
        image: ghcr.io/bluewave-labs/verifywise-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: verifywise
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: verifywise
      component: backend
```

### 7.3 Cross-region disaster recovery

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Cross-Region DR Architecture                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│     Primary Region (Active)              DR Region (Standby)           │
│  ┌─────────────────────────┐       ┌─────────────────────────┐        │
│  │                         │       │                         │        │
│  │  ┌─────────────────┐   │       │  ┌─────────────────┐   │        │
│  │  │   Application   │   │       │  │   Application   │   │        │
│  │  │    Cluster      │   │       │  │    (Scaled to 0)│   │        │
│  │  └────────┬────────┘   │       │  └────────┬────────┘   │        │
│  │           │            │       │           │            │        │
│  │  ┌────────▼────────┐   │       │  ┌────────▼────────┐   │        │
│  │  │   PostgreSQL    │───────────▶  │   PostgreSQL    │   │        │
│  │  │    Primary      │  Async    │  │    Replica      │   │        │
│  │  └─────────────────┘  Replic.  │  └─────────────────┘   │        │
│  │                         │       │                         │        │
│  │  ┌─────────────────┐   │       │  ┌─────────────────┐   │        │
│  │  │   Object Store  │───────────▶  │   Object Store  │   │        │
│  │  │    (Primary)    │  Cross-   │  │    (Replica)    │   │        │
│  │  └─────────────────┘  Region   │  └─────────────────┘   │        │
│  │                       Sync     │                         │        │
│  └─────────────────────────┘       └─────────────────────────┘        │
│                                                                         │
│  DNS: verifywise.example.com ──▶ Primary (failover to DR)             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Recovery runbooks

### 8.1 Service failure recovery

**Backend service not responding:**

```bash
# 1. Check service status
docker compose ps backend

# 2. Check logs for errors
docker compose logs --tail=100 backend

# 3. Restart service
docker compose restart backend

# 4. If restart fails, recreate container
docker compose up -d --force-recreate backend

# 5. Verify health
curl http://localhost:3000/api/health
```

### 8.2 Database failure recovery

**PostgreSQL not starting:**

```bash
# 1. Check PostgreSQL logs
docker compose logs --tail=100 postgresdb

# 2. Check disk space
df -h

# 3. Check if data directory is corrupted
docker compose exec postgresdb ls -la /var/lib/postgresql/data

# 4. If corrupted, restore from backup
./scripts/restore-full.sh /var/backups/verifywise/latest.sql.gz

# 5. If unable to restore, check WAL archive for PITR
./scripts/restore-pitr.sh '2024-01-15 14:30:00'
```

### 8.3 Complete disaster recovery

**Full environment recovery procedure:**

```bash
#!/bin/bash
# Complete disaster recovery script
# Save as: /opt/verifywise/scripts/disaster-recovery.sh

echo "=== VerifyWise Disaster Recovery ==="
echo "Started at: $(date)"

# 1. Verify backup availability
LATEST_BACKUP=$(ls -t /var/backups/verifywise/verifywise_full_*.sql.gz | head -1)
if [ -z "${LATEST_BACKUP}" ]; then
  echo "ERROR: No backup found"
  exit 1
fi
echo "Using backup: ${LATEST_BACKUP}"

# 2. Stop all services
echo "Stopping services..."
docker compose down

# 3. Remove old volumes (WARNING: destructive)
echo "Removing old data..."
docker volume rm verifywise_db verifywise_redis-data 2>/dev/null || true

# 4. Start database only
echo "Starting database..."
docker compose up -d postgresdb redis
sleep 10

# 5. Wait for database to be ready
echo "Waiting for database..."
until docker compose exec -T postgresdb pg_isready -U postgres; do
  sleep 2
done

# 6. Restore database
echo "Restoring database..."
gunzip -c "${LATEST_BACKUP}" | docker compose exec -T postgresdb psql -U postgres -d verifywise

# 7. Run migrations (in case backup is older)
echo "Running migrations..."
docker compose run --rm backend npm run migrate

# 8. Start all services
echo "Starting all services..."
docker compose up -d

# 9. Verify health
echo "Verifying services..."
sleep 30
curl -s http://localhost:3000/api/health || echo "Backend health check failed"
curl -s http://localhost:8080 > /dev/null && echo "Frontend accessible" || echo "Frontend check failed"

echo "=== Disaster Recovery Complete ==="
echo "Completed at: $(date)"
```

### 8.4 Failover to standby database

```bash
#!/bin/bash
# Manual failover to standby PostgreSQL

STANDBY_HOST="standby.example.com"

# 1. Verify standby is up to date
echo "Checking replication lag..."
psql -h ${STANDBY_HOST} -U postgres -c \
  "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"

# 2. Promote standby to primary
echo "Promoting standby..."
psql -h ${STANDBY_HOST} -U postgres -c "SELECT pg_promote();"

# 3. Update application configuration
echo "Updating application..."
# Update DB_HOST environment variable
sed -i "s/DB_HOST=.*/DB_HOST=${STANDBY_HOST}/" .env

# 4. Restart application
docker compose restart backend worker

echo "Failover complete. New primary: ${STANDBY_HOST}"
```

---

## 9. Backup storage recommendations

### 9.1 Storage locations

| Location | Use case | Retention |
|----------|----------|-----------|
| Local disk | Quick recovery, recent backups | 7 days |
| Network storage (NFS/NAS) | On-premises DR | 30 days |
| Object storage (S3/GCS/Azure Blob) | Long-term, off-site | 1 year |
| Cold storage (Glacier/Archive) | Compliance archives | 7 years |

### 9.2 Backup to object storage

```bash
#!/bin/bash
# Backup to S3 (or compatible storage)

BACKUP_FILE=$1
S3_BUCKET="s3://your-backup-bucket/verifywise"

# Upload to S3
aws s3 cp "${BACKUP_FILE}" "${S3_BUCKET}/$(basename ${BACKUP_FILE})"

# Verify upload
aws s3 ls "${S3_BUCKET}/$(basename ${BACKUP_FILE})"

# Set lifecycle policy for automatic archival
# (Configure in S3 bucket settings)
```

### 9.3 Encryption for backups

```bash
# Encrypt backup before storage
gpg --symmetric --cipher-algo AES256 \
  --output backup.sql.gz.gpg \
  backup.sql.gz

# Decrypt for restore
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

---

## 10. Testing DR procedures

### 10.1 DR test schedule

| Test type | Frequency | Duration | Description |
|-----------|-----------|----------|-------------|
| Backup verification | Weekly | 30 min | Verify backup integrity |
| Single-service recovery | Monthly | 1 hour | Restore individual component |
| Full DR simulation | Quarterly | 4 hours | Complete environment recovery |
| Failover test | Semi-annually | 2 hours | Database failover and failback |

### 10.2 DR test checklist

```markdown
## DR Test Checklist

### Pre-test
- [ ] Notify stakeholders of test window
- [ ] Verify backup availability
- [ ] Document current system state
- [ ] Prepare rollback procedures

### During test
- [ ] Execute recovery procedures
- [ ] Document actual RTO
- [ ] Verify all services functional
- [ ] Test user authentication
- [ ] Verify data integrity

### Post-test
- [ ] Document lessons learned
- [ ] Update procedures if needed
- [ ] Report results to stakeholders
- [ ] Schedule next test
```

---

## 11. Integration with enterprise DR/BC

### 11.1 For on-premises deployments

VerifyWise integrates with your existing DR infrastructure:

1. **Database replication**: Configure PostgreSQL streaming replication to your DR site
2. **Backup integration**: Schedule backups to your enterprise backup solution
3. **Monitoring**: Integrate health checks with your monitoring platform
4. **DNS failover**: Configure DNS-based failover to DR environment

### 11.2 Managed service recommendations

| Component | AWS | Azure | GCP |
|-----------|-----|-------|-----|
| Database | RDS PostgreSQL Multi-AZ | Azure Database for PostgreSQL | Cloud SQL |
| Cache | ElastiCache Redis | Azure Cache for Redis | Memorystore |
| Object storage | S3 with Cross-Region Replication | Blob Storage with GRS | Cloud Storage |
| Secrets | Secrets Manager | Key Vault | Secret Manager |

---

## 12. Contact and escalation

During a disaster recovery event:

1. **Initial assessment**: Identify scope and impact
2. **Notify stakeholders**: Inform relevant teams
3. **Execute recovery**: Follow runbook procedures
4. **Verify recovery**: Test all functionality
5. **Post-incident review**: Document and improve

---

## Additional resources

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Security Hardening Guide](./SECURITY_HARDENING_GUIDE.md)
- [Configuration Reference](./CONFIGURATION_REFERENCE.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
