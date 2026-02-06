# Deploy to Vercel (≈1 minute)

The app uses Next.js and builds on Vercel without extra config. Build fetches Google Fonts (Jost)—Vercel’s build has network access, so the build will succeed there.

## 1. Push to GitHub

If not already:

```bash
git init
git add .
git commit -m "Ready for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quickecommerce.git
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. Click **Add New** → **Project**.
3. Import your `quickecommerce` repo. Leave **Framework Preset** as Next.js.
4. **Environment Variables** — add these (required for app to work):

   | Name | Value | Notes |
   |------|--------|------|
   | `DATABASE_URL` | Your Neon connection string | From [Neon](https://neon.tech) dashboard |
   | `BETTER_AUTH_SECRET` | Random string (e.g. 32+ chars) | e.g. `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://YOUR_PROJECT.vercel.app` | Use your Vercel URL after first deploy, or set after |
   | `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | From [Stripe](https://dashboard.stripe.com) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook (create endpoint for production URL) |

5. Click **Deploy**. Wait for the build to finish.

## 3. Set BETTER_AUTH_URL (if needed)

After the first deploy, Vercel will show a URL like `https://quickecommerce-xxx.vercel.app`.

- In Vercel: **Project → Settings → Environment Variables**
- Add or update `BETTER_AUTH_URL` = `https://quickecommerce-xxx.vercel.app` (your real URL).
- **Redeploy**: Deployments → ⋮ on latest → **Redeploy**.

## 4. Database

- **Neon**: Use the same DB as local, or create a new project and run migrations:
  ```bash
  DATABASE_URL="postgresql://..." npm run db:push
  npm run db:seed   # optional
  ```
- **Stripe**: In production, create a webhook endpoint for `https://YOUR_APP.vercel.app/api/stripe` and set `STRIPE_WEBHOOK_SECRET` in Vercel.

Done. Your app should be live at the Vercel URL.
