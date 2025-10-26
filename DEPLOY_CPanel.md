Deployment guide — cPanel (static export vs Node)

This repository is a Next.js 13 app that is primarily client-side and uses localStorage for data. Choose one of the two deployment methods below depending on whether you need server features (API routes, SSR).

A — Recommended: Static export (simple, works on shared cPanel hosting)

1) Locally prepare the export and zip:

PowerShell (run from repo root):

```powershell
# run the included helper (Windows PowerShell)
.\build-and-zip.ps1
# this will create site-export.zip in the repo root
```

Or run manually:

```powershell
npm ci
npm run build
npm run export
# create site-export.zip from the `out` folder
Compress-Archive -Path .\out\* -DestinationPath .\site-export.zip
```

2) Upload to cPanel
- Login to cPanel -> File Manager.
- Navigate to `public_html` (or the domain/subdomain folder you want to use).
- Upload `site-export.zip` using Upload button.
- Select `site-export.zip` and click Extract.

3) SPA routing
- If your app uses client-side routes (it does), add the following `.htaccess` in `public_html` (the build script already writes `.htaccess` into `out/` before zipping):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^.*$ /index.html [L,QSA]
</IfModule>
```

4) Test your site by opening your domain.

Limitations: No server APIs or SSR. If you rely on API routes in `pages/api`, they won't work — use the Node option below.

B — Full Node deployment (for SSR/API routes)

Use this if you need `pages/api/*` or server-side rendering.

Option 1 — cPanel Application Manager (recommended on cPanel that supports Node apps)
- In cPanel, open "Setup Node.js App" (Application Manager).
- Create a new app:
  - Node.js version: choose >= 18
  - Application mode: Production
  - Application root: path to your application (e.g., `~/project-folder`)
  - Application startup file/command: `npm start` (ensure package.json has a start script below)
- After creation, run the following via cPanel Terminal or SSH inside the app folder:

```bash
# install dependencies
npm ci --production
# build
npm run build
# start will be handled by Application Manager (it sets PORT)
```

Make sure `package.json` contains a start script that respects the PORT environment variable, for example:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start -p $PORT",
  "export": "next export"
}
```

If cPanel doesn't substitute $PORT in the command, set the startup command to:

```
node ./node_modules/next/dist/bin/next start -p $PORT
```

Option 2 — SSH + PM2 (if you have SSH and pm2 installed)

```bash
# on server, in project folder
npm ci --production
npm run build
pm2 start "npm -- start" --name qanari-store
pm2 save
```

C — Environment variables & storage
- If your app needs env vars, set them in Application Manager or export them before starting.
- The app currently uses browser localStorage for persistence. If you need server-side uploads or persistent storage, plan S3/FTP or a database.

D — Debugging & logs
- Application Manager shows stdout/stderr logs.
- For PM2, use `pm2 logs qanari-store`.

E — Passenger friendly error pages (Phusion Passenger)

Phusion Passenger can show a helpful "friendly error page" when an app
fails to start. This page includes the startup error message, a backtrace
and an environment dump — useful during development, but it may reveal
credentials or other sensitive information. By default Passenger only
enables these friendly error pages when the application environment is
set to `development`.

Controls:
- PassengerAppEnv (aliases: `RailsEnv`, `RackEnv`) — sets the environment
  Passenger uses. Example values: `development`, `production`.
- PassengerFriendlyErrorPages — (if supported by your Passenger build)
  can explicitly enable/disable the friendly pages.

Examples (add to your `.htaccess` inside the `IfModule mod_passenger.c` block):

```apache
# Enable friendly error pages (development/staging only)
# PassengerAppEnv development

# Disable friendly error pages for public production sites
# PassengerAppEnv production
```

Recommendations:
- Do NOT enable friendly error pages on a public production site — set
  `PassengerAppEnv production` instead so error details are not exposed.
- Use `PassengerAppEnv development` only on staging/dev environments or
  when debugging locally on a development server.
- If you need more control, check whether your host exposes the
  `PassengerFriendlyErrorPages` option and set it to `off` in production.

If you'd like, I can add the commented `PassengerAppEnv` examples to the
repository `.htaccess` (or enable `development` temporarily) and update
the deployment notes with the exact `.htaccess` lines you should apply
on your host. Currently the repo's `.htaccess` includes commented
examples for `PassengerNodejs`; I can extend that with the PassengerAppEnv
comments so the setting is easy to toggle.

If you want, I can:
- Create the `build-and-zip.ps1` script (done) and a `.htaccess` in the export (done by script).
- Update `package.json` to add a `start` script that uses `$PORT` (I can make a minimal change if you want to run on cPanel App Manager).
- Provide exact step-by-step commands tailored to your cPanel (I can write the exact commands to run in the cPanel Terminal).

Tell me which deployment route you prefer and I will produce any small changes (package.json edit, startup command) or additional scripts.