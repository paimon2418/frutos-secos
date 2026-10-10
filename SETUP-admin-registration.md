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

- `ADMIN_PASSWORD`: a new, unique password with at least 16 characters. Use a password manager; do not reuse your MongoDB password.
- `ADMIN_SESSION_SECRET`: a separate random secret with at least 32 characters.
- `PUBLIC_SITE_URL`: the stable production website origin, for example `https://frutos-secos-gray.vercel.app`.

Keep the existing `MONGODB_URI` and `MONGODB_DB=frutos_secos`. Redeploy after saving environment variables.

## MongoDB role needed

The app database user currently has `FIND` on `frutos_secos.cafes` and `INSERT` on `frutos_secos.feedback`. Add one action to its existing custom role:

- Action: `INSERT`
- Database: `frutos_secos`
- Collection: `cafes`

Keep the existing `FIND` on `cafes` and `INSERT` on `feedback`. The registration API needs `FIND` to check generated IDs and `INSERT` to create the café profile. It does not need update or delete permissions.

## Registering a café

1. Deploy the files and required environment variables.
2. Open `https://frutos-secos-gray.vercel.app/admin.html` and sign in with `ADMIN_PASSWORD`.
3. Enter the café details and its Google Maps review link.
4. The page saves the record, then displays the generated café ID, feedback URL, and QR code.

The photo field currently accepts an HTTPS image URL; it does not upload a file. GST number and photo URL are optional. The QR image is rendered by an external QR-code service and contains only the public feedback URL.

## Security notes

- The admin page uses an HttpOnly, Secure, SameSite cookie signed with `ADMIN_SESSION_SECRET`.
- Do not place either admin secret or `MONGODB_URI` in HTML or client-side JavaScript.
- Atlas still has the temporary `0.0.0.0/0` network entry. The custom database role limits what the application account can do, but any IP can attempt a connection. Removing that entry will block Vercel Hobby functions until a stable outbound IP or another backend is configured.
