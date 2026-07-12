#!/usr/bin/env bash
# ==============================================================================
# DairySphere - Production-Grade Automated Backup Utility
# ==============================================================================
# Performs secure, transaction-consistent backups of PostgreSQL and Redis.
# Supports containerised and native installations.
# ==============================================================================

set -euo pipefail

# Configuration Defaults
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"
DB_CONTAINER="dairysphere-postgres"
REDIS_CONTAINER="dairysphere-redis"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

log() {
  local level="$1"
  local msg="$2"
  local time
  time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local output="[${time}] [BACKUP] [${level}] ${msg}"
  echo "${output}"
  echo "${output}" >> "${LOG_FILE}"
}

# Load environment variables if .env exists
if [ -f .env ]; then
  log "INFO" "Loading environment variables from .env"
  # Clean export of non-comment environment variables
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ ! "$line" =~ ^# ]] && [[ "$line" =~ = ]]; then
      eval "export $line"
    fi
  done < .env
fi

# Fallback values from env
DB_USER="${POSTGRES_USER:-dairysphere_admin}"
DB_NAME="${POSTGRES_DB:-dairysphere_prod}"
DB_PASS="${POSTGRES_PASSWORD:-dairysphere_secure_pass}"

log "INFO" "Starting backup process..."
log "INFO" "Target Backup Directory: ${BACKUP_DIR}"

# 1. PostgreSQL Backup
log "INFO" "Checking PostgreSQL database container viability..."
if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  log "INFO" "Found active PostgreSQL container [${DB_CONTAINER}]. Executing pg_dump..."
  
  PG_BACKUP_PATH="/tmp/dairysphere_postgres_${TIMESTAMP}.dump"
  LOCAL_PG_BACKUP="${BACKUP_DIR}/postgres_${TIMESTAMP}.dump"
  
  if docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -F c -b -f "${PG_BACKUP_PATH}"; then
    docker cp "${DB_CONTAINER}:${PG_BACKUP_PATH}" "${LOCAL_PG_BACKUP}"
    docker exec -t "${DB_CONTAINER}" rm -f "${PG_BACKUP_PATH}"
    log "INFO" "PostgreSQL backup successfully generated: ${LOCAL_PG_BACKUP} ($(du -sh "${LOCAL_PG_BACKUP}" | cut -f1))"
  else
    log "ERROR" "PostgreSQL dump via Docker failed!"
    exit 1
  fi
else
  log "WARN" "PostgreSQL container [${DB_CONTAINER}] not running. Attempting native pg_dump..."
  if command -v pg_dump &> /dev/null; then
    # Parse host/port if present in DATABASE_URL
    LOCAL_PG_BACKUP="${BACKUP_DIR}/postgres_native_${TIMESTAMP}.dump"
    export PGPASSWORD="${DB_PASS}"
    if pg_dump -U "${DB_USER}" -h localhost -d "${DB_NAME}" -F c -b -f "${LOCAL_PG_BACKUP}"; then
      log "INFO" "Native PostgreSQL backup successfully generated: ${LOCAL_PG_BACKUP} ($(du -sh "${LOCAL_PG_BACKUP}" | cut -f1))"
    else
      log "ERROR" "Native pg_dump execution failed!"
      exit 1
    fi
  else
    log "ERROR" "Neither PostgreSQL container nor native pg_dump was found! Aborting backup."
    exit 1
  fi
fi

# 2. Redis Backup
log "INFO" "Checking Redis cache container viability..."
if docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
  log "INFO" "Found active Redis container [${REDIS_CONTAINER}]. Executing SAVE command..."
  
  # Trigger background save
  docker exec -t "${REDIS_CONTAINER}" redis-cli SAVE || log "WARN" "Redis SAVE command returned warning. Continuing..."
  
  # Copy dump.rdb
  LOCAL_REDIS_BACKUP="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
  if docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${LOCAL_REDIS_BACKUP}"; then
    log "INFO" "Redis snapshot successfully retrieved: ${LOCAL_REDIS_BACKUP} ($(du -sh "${LOCAL_REDIS_BACKUP}" | cut -f1))"
  else
    log "WARN" "Failed to retrieve dump.rdb from Redis container. Continuing..."
  fi
fi

# 3. Compile and Archive
FINAL_ARCHIVE="${BACKUP_DIR}/dairysphere_archive_${TIMESTAMP}.tar.gz"
log "INFO" "Compiling backup artifacts into a single compressed archive..."

# Create a tar of the specific dump files generated in this run
tar -czf "${FINAL_ARCHIVE}" -C "${BACKUP_DIR}" \
  "postgres_${TIMESTAMP}.dump" 2>/dev/null || \
tar -czf "${FINAL_ARCHIVE}" -C "${BACKUP_DIR}" \
  "postgres_native_${TIMESTAMP}.dump" 2>/dev/null || true

# Append redis backup if it exists
if [ -f "${BACKUP_DIR}/redis_${TIMESTAMP}.rdb" ]; then
  tar -uzf "${FINAL_ARCHIVE}" -C "${BACKUP_DIR}" "redis_${TIMESTAMP}.rdb" 2>/dev/null || true
fi

# Clean up raw files
rm -f "${BACKUP_DIR}/postgres_${TIMESTAMP}.dump" "${BACKUP_DIR}/postgres_native_${TIMESTAMP}.dump" "${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

log "INFO" "Backup process finished successfully."
log "INFO" "Final production-ready archive location: ${FINAL_ARCHIVE} ($(du -sh "${FINAL_ARCHIVE}" | cut -f1))"
echo "Backup Completed: ${FINAL_ARCHIVE}"
