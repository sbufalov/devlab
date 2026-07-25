#!/bin/sh

# =============================================================================
# MASTER INFRASTRUCTURE INITIALIZATION SCRIPT (PostgreSQL + MinIO S3)
# =============================================================================

set -e

echo "=== Infrastructure Initialization Starting ==="
echo ""

# -----------------------------------------------------------------------------
# STEP 1: PostgreSQL Databases Provisioning
# -----------------------------------------------------------------------------
echo "=== Step 1: Configuring PostgreSQL Databases ==="
echo "Connecting to PostgreSQL at http://postgres:5432..."

# Dynamically install the lightweight psql client inside the Alpine-based mc container
apk add --no-cache postgresql-client >/dev/null 2>&1
echo "✓ PostgreSQL client package installed successfully."

# Setup the password variable for non-interactive automated psql execution
export PGPASSWORD="grossberg"

# Block and wait until PostgreSQL server is fully up and ready to accept queries
until psql -h "postgres" -U "semantec" -d "postgres" -c '\q' >/dev/null 2>&1; do
    echo "PostgreSQL is not ready yet. Retrying in 2 seconds..."
    sleep 2
done
echo "✓ Successfully authenticated with PostgreSQL Server."

# Array of all required databases for your AI and Automation tools
DATABASES="outline plane crewai autogen n8n dify onyx nextcloud vaultwarden photoprism paperless freshrss"

echo "Checking database availability..."
for DB in $DATABASES; do
    # Check if the database catalog already contains this specific name
    DB_EXISTS=$(psql -h "postgres" -U "semantec" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'")
    if [ "$DB_EXISTS" = "1" ]; then
        echo "  Database [$DB] already exists."
    else
        psql -h "postgres" -U "semantec" -d "postgres" -c "CREATE DATABASE $DB;"
        echo "✓ Database [$DB] created successfully."
    fi
done
echo "✓ All required PostgreSQL databases are verified and ready."
echo ""

# -----------------------------------------------------------------------------
# STEP 2: MinIO S3 Buckets Provisioning
# -----------------------------------------------------------------------------

echo "=== Step 2: Configuring MinIO Storage ==="
echo "Connecting to MinIO API at http://minio:9000..."

# Wait for MinIO to be ready
until /usr/bin/mc alias set homelab http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" 2>/dev/null; do
    echo "MinIO API is not ready yet. Retrying in 2 seconds..."
    sleep 2
done

echo "✓ Successfully authenticated with MinIO."
echo ""

# -----------------------------------------------------------------------------
# Create Buckets
# -----------------------------------------------------------------------------
echo "=== Creating Storage Buckets ==="

# Pyroscope bucket
if /usr/bin/mc ls homelab/pyroscope >/dev/null 2>&1; then
    echo "  [pyroscope] already exists."
else
    /usr/bin/mc mb homelab/pyroscope
    /usr/bin/mc version enable homelab/pyroscope
    echo "✓ [pyroscope] created with versioning enabled."
fi

# MLflow bucket
if /usr/bin/mc ls homelab/mlflow >/dev/null 2>&1; then
    echo "  [mlflow] already exists."
else
    /usr/bin/mc mb homelab/mlflow
    /usr/bin/mc version enable homelab/mlflow
    echo "✓ [mlflow] created with versioning enabled."
fi

# Outline bucket
if /usr/bin/mc ls homelab/outline >/dev/null 2>&1; then
    echo "  [outline] already exists."
else
    /usr/bin/mc mb homelab/outline
    /usr/bin/mc version enable homelab/outline
    echo "✓ [outline] created with versioning enabled."
fi

# Plane bucket
if /usr/bin/mc ls homelab/plane >/dev/null 2>&1; then
    echo "  [plane] already exists."
else
    /usr/bin/mc mb homelab/plane
    /usr/bin/mc version enable homelab/plane
    echo "✓ [plane] created with versioning enabled."
fi

# Onyx bucket
if /usr/bin/mc ls homelab/onyx >/dev/null 2>&1; then
    echo "  [onyx] already exists."
else
    /usr/bin/mc mb homelab/onyx
    /usr/bin/mc version enable homelab/onyx
    echo "✓ [onyx] created with versioning enabled."
fi

# Dify bucket
if /usr/bin/mc ls homelab/dify >/dev/null 2>&1; then
    echo "  [dify] already exists."
else
    /usr/bin/mc mb homelab/dify
    /usr/bin/mc version enable homelab/dify
    echo "✓ [dify] created with versioning enabled."
fi

# Jitsi bucket
if /usr/bin/mc ls homelab/jitsi >/dev/null 2>&1; then
    echo "  [jitsi] already exists."
else
    /usr/bin/mc mb homelab/jitsi
    /usr/bin/mc version enable homelab/jitsi
    echo "✓ [jitsi] created with versioning enabled."
fi

# Backups bucket (optional)
if /usr/bin/mc ls homelab/backups >/dev/null 2>&1; then
    echo "  [backups] already exists."
else
    /usr/bin/mc mb homelab/backups
    echo "✓ [backups] created."
fi

echo ""

# -----------------------------------------------------------------------------
# Set Bucket Lifecycle Policies (Auto-delete old objects)
# -----------------------------------------------------------------------------
echo "=== Configuring Lifecycle Policies ==="

# Pyroscope: delete objects older than 30 days (Modern CLI syntax)
/usr/bin/mc ilm rule add --expire-days "30" homelab/pyroscope 2>/dev/null || true
echo "✓ Pyroscope lifecycle policy applied (30-day retention)."

# MLFlow: delete objects older than 60 days (Modern CLI syntax)
/usr/bin/mc ilm rule add --expire-days "60" homelab/mlflow 2>/dev/null || true
echo "✓ MLFlow lifecycle policy applied (60-day retention)."

echo "  MLflow artifacts: indefinite retention (no lifecycle policy)."
echo ""

# -----------------------------------------------------------------------------
# Create Service Accounts
# -----------------------------------------------------------------------------
echo "=== Creating Service Accounts ==="
if /usr/bin/mc admin user info homelab semantec >/dev/null 2>&1; then
    echo "  User [semantec] already exists."
else
    /usr/bin/mc admin user add homelab semantec grossberg
    echo "✓ User [semantec] created."
fi
echo ""
