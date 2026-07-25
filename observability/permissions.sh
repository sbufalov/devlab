#!/bin/sh

echo "Initializing directory structures..."
mkdir -p /homelab/observability/grafana/data
mkdir -p /homelab/observability/victoriametrics/data
mkdir -p /homelab/observability/clickhouse/data
mkdir -p /homelab/observability/jaeger/badger
mkdir -p /homelab/observability/alertmanager/data
mkdir -p /homelab/observability/pyroscope/data

echo "Applying permissions..."
chown -R 472:472     /homelab/observability/grafana/data
chown -R 101:101     /homelab/observability/clickhouse/data
chown -R 65534:65534 /homelab/observability/alertmanager/data
chown -R 65534:65534 /homelab/observability/victoriametrics/data
chown -R 10001:10001 /homelab/observability/pyroscope/data
chown -R 10001:10001 /homelab/observability/jaeger/badger

echo "Done!"
