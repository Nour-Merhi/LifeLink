# Deploying LifeLink Backend to Railway

## Project settings

1. **Root Directory**: Set to `Backend` (or `./Backend`). Railway must build from the Laravel app root.

2. **Required environment variables** (set in Railway dashboard):
   - `APP_KEY` – Run `php artisan key:generate --show` locally and paste the value.
   - `APP_ENV` – `production`
   - `APP_DEBUG` – **`false`** (never `true` in production).
   - `APP_URL` – Your Railway service URL (e.g. `https://your-app.up.railway.app`).
   - **`SESSION_DRIVER`** – **Use `cookie`** (recommended) or `array`. `cookie` stores sessions in encrypted cookies (persists, no DB needed). `array` is in-memory only (doesn't persist, can cause auth issues). Avoid `database` as it requires a `sessions` table and can 502 if DB is unreachable.
   - **`CACHE_STORE`** – **Must be `array`** (not `database`). Database cache can contribute to 502; `array` avoids DB for cache.
   - **`FRONTEND_URL`** – Your frontend URL (e.g. `https://life-link-react-app.vercel.app`). Used for Sanctum stateful domains.
   - **`SANCTUM_STATEFUL_DOMAINS`** – Comma‑separated domains for stateful auth, e.g. `localhost:5173,127.0.0.1:5173,life-link-react-app.vercel.app`.

   **Database** (if using MySQL/Postgres on Railway or elsewhere):
   - `DB_CONNECTION` – `mysql`, `pgsql`, or `sqlite`
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (for MySQL/Postgres)
   - For SQLite: `DB_DATABASE` = path to DB file (e.g. `/tmp/database.sqlite`; Railway filesystem is ephemeral).

3. **Build / Start**: Handled by `railway.toml` and `nixpacks.toml`. Do not override build/start in the dashboard unless you know what you’re doing. If Nixpacks fails, you can add a `Dockerfile` in `Backend` and set Railway to use the Dockerfile builder.

4. **Migrations**: Run manually after deploy, or add a release command:
   ```bash
   php artisan migrate --force
   ```
   Do not run migrations in the start command.

## Troubleshooting

- **Build fails on `composer install`**: Ensure Root Directory is `Backend` and `composer.json` is present.
- **502 / App not responding**: Check that `APP_KEY` and `APP_URL` are set. Confirm the start command uses `$PORT` (Railway injects it).
- **502 on `/` or `/favicon.ico` but `/up` works**: Set **`SESSION_DRIVER=array`** and **`CACHE_STORE=array`**. Web routes use session; the default `database` driver fails if DB isn’t configured, which crashes those requests. `/up` doesn’t use session, so it still returns 200.
- **CORS errors**: Ensure your frontend origin is listed in `config/cors.php` under `allowed_origins`.
- **401 Unauthorized on `/api/user`**: 
  - **If user is NOT logged in**: This is expected and normal. The error is handled gracefully.
  - **If user IS logged in but still gets 401**: Ensure **`FRONTEND_URL`** and/or **`SANCTUM_STATEFUL_DOMAINS`** are set correctly in Railway. Sanctum needs to recognize your Vercel frontend (`life-link-react-app.vercel.app`) as a stateful domain to send authentication cookies.
- **Login redirects back to login page / Dashboard flashes then redirects**: If using `SESSION_DRIVER=array`, switch to **`SESSION_DRIVER=cookie`**. `array` doesn't persist sessions, causing authentication to fail after login. `cookie` stores sessions in encrypted cookies and works properly with Sanctum SPA authentication.
- **Never commit `.env`** – It contains secrets (DB, mail, API keys). Use Railway dashboard env vars for production; keep `.env` local only.

- **Images (articles, hospitals) disappear after redeploy**: Railway’s filesystem is ephemeral. Files in `storage/` and `public/uploads/` are lost on each deploy. To fix:
  1. Use **persistent storage**: [Railway Volumes](https://docs.railway.app/reference/volumes) or cloud storage (S3, Cloudinary).
  2. Or store small images as base64 in the database (works for hospitals; articles currently use file paths).
  3. Ensure `APP_URL` is set correctly in Railway so `asset()` generates valid image URLs.
