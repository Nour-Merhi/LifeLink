#!/bin/sh
set -e

# Railway injects env vars at runtime. If config is cached at build-time,
# Laravel may keep stale values (causing Sanctum stateful/CSRF issues).
# Clear and (re)cache at boot using the *runtime* env.
php artisan optimize:clear || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

PORT="${PORT:-8080}"
exec php -S 0.0.0.0:"$PORT" -t public