# Café admin registration setup

These files add a password-protected admin page at `/admin.html`. It saves café profiles to the existing `frutos_secos.cafes` collection, creates a `cafeId`, and returns a feedback link and QR code.

## Files to copy into the website repository

- `admin.html` at the repository root
- `api/admin-login.js`
- `api/cafes.js`
- `lib/admin-auth.js`

The existing project must keep its `mongodb` package dependency and its current feedback API files.

## Vercel environment variables

In Project Settings → Environment Variables, add these for Production (and Preview only if you want to test the admin page in previews):

- `ADMIN_PASSWORD`: a unique password with at least 16 characters. Use a password manager; do not reuse your MongoDB password.
- `ADMIN_SESSION_SECRET`: a separate random secret with at least 32 characters.
- `PUBLIC_SITE_URL`: the stable production website origin, for example `https://frutos-secos-gray.vercel.app`.

Keep `MONGODB_URI` and `MONGODB_DB=frutos_secos` server-side in Vercel Environment Variables. Redeploy after saving environment variables.

## Minimum MongoDB role for the current APIs

Use a dedicated MongoDB database user, not an Atlas account or project administrator. Grant only these custom privileges:

- `FIND` and `INSERT` on database `frutos_secos`, collection `cafes`.
- `INSERT` on database `frutos_secos`, collection `feedback`.

Do not grant `readWrite` on the entire database, `readWriteAnyDatabase`, `dbAdmin`, or Atlas administrator access. These APIs need to look up café IDs and insert cafés, and insert feedback; they do not need update or delete privileges.

Use a password manager to generate a unique database password with at least 32 random characters. Never reuse the admin password. If the database password contains reserved URI characters such as `@`, `:`, `/`, `?`, `#`, or `%`, percent-encode the password portion when building `MONGODB_URI`. Store that connection string only in Vercel Environment Variables. If it was ever committed to GitHub or shown in a screenshot, change it immediately.

## Atlas network access and Vercel Hobby

Do not add or document `0.0.0.0/0`. It allows connection attempts from every IPv4 address.

Vercel Hobby functions use outbound IP addresses that can change. That means a direct Atlas connection cannot be reliably restricted to a small, stable Vercel IP allowlist on Hobby. Vercel Static IPs are available on Pro and Enterprise plans.

The safest choices are:

1. Keep Atlas restricted to exact IP addresses and use a hosting/network option with a stable outbound IP, or a Vercel plan with Static IPs. Add only the exact provider IPs to Atlas.
2. If you must stay on Hobby and connect directly to Atlas, allowing `0.0.0.0/0` may be needed for connectivity. This is a security tradeoff, not a safe allowlist. Reduce the impact with the dedicated least-privilege database user above, a unique 32+ character database password, and server-side-only secrets. Do not use this as a long-term secure setup.

To inspect Atlas access entries: sign in to MongoDB Atlas → select the project → **Security** → **Network Access** → **IP Access List**. Remove any `0.0.0.0/0` entry when the app has been moved to a host with stable egress. Do not remove the exact current-user IP entry if you still need to connect to Atlas from your computer.

## Registering a café

1. Deploy the files and required environment variables.
2. Open `https://frutos-secos-gray.vercel.app/admin.html` and sign in with `ADMIN_PASSWORD`.
3. Enter the café details, including its Google Maps review link.
4. The page saves the record, then displays the generated café ID, feedback URL, and QR code.

The photo field currently accepts an HTTPS image URL; it does not upload a file. GST number and photo URL are optional. The QR image is rendered by an external QR-code service and contains only the public feedback URL.

## Security notes

- The admin page uses an HttpOnly, Secure, SameSite cookie signed with `ADMIN_SESSION_SECRET`.
- Never put `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, or `MONGODB_URI` in HTML, client-side JavaScript, or public documentation.
- Treat any secret that was committed to a public GitHub repository as compromised, even if the commit was later edited or deleted. Rotate it before relying on it again.
