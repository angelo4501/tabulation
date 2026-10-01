# Vercel Deployment

Required workflow:

```text
feature branch
  -> GitHub pull request
  -> Vercel Preview Deployment
  -> testing and approval
  -> merge to main
  -> Vercel Production Deployment
```

Use Vercel's native GitHub integration. Do not deploy through a separate GitHub Actions workflow for this MVP.

## 1. Import the repository

1. Open Vercel.
2. Choose **Add New Project**.
3. Import `angelo4501/tabulation` from GitHub.
4. Keep `main` as the production branch.

## 2. Configure framework preset

Vercel should detect **Next.js** automatically.

Build settings:

```text
Install Command: npm ci
Build Command: npm run build
Output Directory: .next
```

## 3. Add Preview environment variables

In Vercel Project Settings -> Environment Variables, add these for **Preview**:

```env
NEXT_PUBLIC_APP_URL=https://your-preview-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your-preview-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-preview-service-role-key
```

## 4. Add Production environment variables

Add the same variable names for **Production**, pointing to the production Supabase project:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

## 5. Configure Supabase Authentication redirect URLs

In Supabase Dashboard -> Authentication -> URL Configuration:

1. Set the site URL to the production app URL.
2. Add preview redirect URLs:

```text
https://*.vercel.app/auth/sign-in
```

3. Add production redirect URLs:

```text
https://your-production-domain/auth/sign-in
```

## 6. Deploy first preview

Push a feature branch and open a GitHub pull request. Vercel will create a preview deployment automatically.

Validate:

- Landing page loads.
- Sign-in page loads.
- Admin pages require authentication.
- Judge pages require authentication.
- Published result pages are inaccessible before publication.
- CSV routes require administrator authentication.

## 7. Merge to main

After review and approval, merge the pull request into `main`. Vercel will deploy production automatically.

## 8. Verify production

Open the production URL and test:

- Sign in as administrator.
- Create or open an event.
- Assign a judge.
- Open judging.
- Submit scores as a judge.
- Close and publish results.
- Open public results and presentation mode.
- Export CSV.
- Use browser print-to-PDF for the official result sheet.

Do not claim deployment is complete until the production URL has been opened and tested.
