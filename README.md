# Frutos Secos — Site

Plain static site. No build step, no framework — Vercel serves `index.html` as-is.

## Push to a new GitHub repo

```bash
cd frutos-secos-site
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/frutos-secos.git
git push -u origin main
```

## Deploy on Vercel

1. Go to vercel.com → Add New Project → Import Git Repository.
2. Select the repo you just pushed.
3. Framework Preset: choose **Other** (not Next.js) — this is a static HTML site.
4. Leave Build Command and Output Directory blank.
5. Deploy.

## Custom domain (frutossecos.in)

In the Vercel project → Settings → Domains → add `frutossecos.in`, then point your
domain's DNS (A/CNAME records, per Vercel's instructions) to Vercel.

## Notes

- Cart data is stored in the browser (`localStorage`) — it's per-device, not shared.
- The café partner form posts to a Google Apps Script URL (`GOOGLE_SCRIPT_URL` in the
  script) — make sure that's set to your live Apps Script deployment before going live.
