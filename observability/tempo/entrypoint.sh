#!/bin/bash

# Exit immediately if any command fails unexpectedly (optional safety)
set -e

# 1. Fix permissions for tempo data directory
mkdir -p /tmp/tempo
chown -R 10001:10001 /tmp/tempo
chmod -R 755 /tmp/tempo

# 2. Start tempo with the original command
exec /tempo "$@"
