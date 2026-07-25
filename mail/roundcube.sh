#!/bin/sh

# Exit immediately if any command fails unexpectedly (optional safety)
set -e

# 1. Update system CA certificates
update-ca-certificates

# 2. Safely backup Composer binaries if they exist
mv /usr/bin/composer /usr/bin/composer.bak 2> /dev/null || true
mv /usr/local/bin/composer /usr/local/bin/composer.bak 2> /dev/null || true

# 3. Hand over execution to the original Docker entrypoint
exec /docker-entrypoint.sh php-fpm
