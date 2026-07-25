-- =============================================================================
-- CLICKHOUSE DATABASE INITIALIZATION
-- =============================================================================

-- Create main database if not exists
CREATE DATABASE IF NOT EXISTS semantec;

-- Use the database
USE semantec;

-- =============================================================================
-- QRYN LOG TABLES (will be auto-created by qryn, but we can pre-create)
-- =============================================================================

-- Time-series log table (auto-created by qryn v3+)
-- CREATE TABLE IF NOT EXISTS time_series (
--     date Date DEFAULT toDate(timestamp_ns / 1000000000),
--     fingerprint UInt64,
--     labels String,
--     name String,
--     timestamp_ns Int64,
--     value Float64
-- ) ENGINE = MergeTree()
-- PARTITION BY toYYYYMM(date)
-- ORDER BY (fingerprint, timestamp_ns)
-- TTL date + INTERVAL 14 DAY;

-- =============================================================================
-- CUSTOM ML METRICS TABLE (optional - for storing custom ML metrics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ml_metrics (
    timestamp DateTime DEFAULT now(),
    experiment_id String,
    run_id String,
    metric_name String,
    metric_value Float64,
    step Int32,
    tags Map(String, String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (experiment_id, run_id, metric_name, timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- =============================================================================
-- SYSTEM METRICS TABLE (optional - for aggregated host metrics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_metrics (
    timestamp DateTime DEFAULT now(),
    host String,
    metric_name String,
    metric_value Float64,
    labels Map(String, String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (host, metric_name, timestamp)
TTL timestamp + INTERVAL 30 DAY;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT ALL ON semantec.* TO semantec;
