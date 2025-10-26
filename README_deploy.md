# Deploy notes for shared hosting (cPanel + Phusion Passenger)

Short checklist:

- Build the Next.js app locally or on the host: `npm run build`.
- Ensure `server.js`, `.htaccess`, and `package.json` are present in the site root.
- Upload the generated zip parts (see script) to the host and extract them in the application folder.
- Install dependencies on the host (recommended): use the cPanel Node.js app UI or run `npm ci --production` in the app root.
- In cPanel select Node v20.x (matching `engines`), set the application root and start file (`server.js`), and start the app (Passenger will run it).

Troubleshooting Passenger "could not be started" errors:

1) Check host Node version: set it to 20.x to match `engines.node`.
2) Check logs: Passenger errors appear in the web host error log (or Passenger log). Search the log for the Error ID shown on the error page.
3) Ensure `node_modules` exists on the host: either install via cPanel or run `npm ci` after extracting the zips. Passenger needs required modules installed.
4) Ensure `server.js` is present and executable as the start file and `PassengerStartupFile` points to it.
5) If you cannot run `npm install` on the host, include `node_modules` in the zip by running the PowerShell script with `-IncludeNodeModules` (warning: large upload).

Why your zips could be much smaller than the full project size:

- By default the packaging script excludes `node_modules`. That folder is often the largest part of a Node project. Excluding it greatly reduces zip size.
- Many small files compress very well, so compressed zips may be smaller than the source directory total.
- Media or large binary files not present in `public/` or `.next/` won't be included unless you explicitly copy them.

If your project folder is ~300MB, but node_modules is excluded, zips can be much smaller. To include everything, pass `-IncludeNodeModules` to the packaging script (but expect big zip files and longer uploads).

Uploading the chunked zips to cPanel:

1. Upload each `deploy-part-*.zip` to the destination folder in File Manager.
2. Extract each zip (they are independent archives that contain subsets of the project). Extract all of them so the final folder contains the whole app.
3. After extraction, open Terminal (or SSH) and run `npm ci --production` in the site root (or use cPanel app UI to install deps).
4. In cPanel Node.js app settings choose Node v20, set the application root and startup file to `server.js`, and restart the app.

If you need, I can:
- Update `server.js` to match any custom host requirements.
- Modify the packaging script to create a single large zip and then split the binary into 30MB parts (host extraction may be harder).
- Provide exact `.htaccess` lines tuned for your host if you tell me the cPanel username/path.
