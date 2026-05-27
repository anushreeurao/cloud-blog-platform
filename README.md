# Inkflow - Full-Stack Medium-Like Blogging Platform

Inkflow is a production-grade blog platform inspired by Medium, Substack, Hashnode, and Notion.

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Framer Motion animations
- shadcn-style UI primitives
- Supabase Auth (email/password + Google OAuth)
- Supabase PostgreSQL + Storage
- RLS-first security model
- Vercel deployment

## Features

### Authentication
- Email/password sign-up + sign-in
- Google OAuth sign-in
- Forgot password flow (`/auth/forgot`)
- Reset password flow (`/auth/reset-password`)
- Email verification handler (`/auth/confirm`)
- Session persistence via `@supabase/ssr`
- Logout
- Protected routes with middleware
- Auto profile creation via DB trigger

### Roles
- `admin`
- `writer`
- `reader`

### Content
- Featured, trending, latest feeds
- Search + tag filters
- Writer dashboard with analytics cards
- Create, edit, publish/unpublish, delete posts
- Dedicated rich markdown editor + live preview
- Draft autosave
- Cover image URL support
- SEO title/description fields

### Engagement
- Like posts
- Bookmark posts
- Comment system
- Follow writers
- Related posts

### Media
- Drag-and-drop image upload to Supabase Storage
- Copy public URL
- Per-user storage path policy

### Profile
- Public profile page
- Writer bio + links
- Published post list
- Follow/unfollow

### Admin
- Role-gated `/admin` panel
- User list
- Post moderation queue
- Platform analytics overview

### UX + UI
- Responsive mobile-first layout
- Dark/light mode
- Page transitions
- Empty/loading/error states
- Toast notifications
- Minimal modern premium styling

### SEO
- Dynamic metadata
- OpenGraph + Twitter cards
- Canonical URLs
- JSON-LD blog posting schema
- Dynamic sitemap
- robots.txt

### Security + Performance
- RLS on all core tables
- Storage policies
- Route protection middleware
- API input validation with Zod
- Simple API rate limiting utility
- Server Components for data-heavy pages
- Pagination on home feed

---

## Project Structure

```txt
src/
  app/
    admin/
    auth/
      callback/
    dashboard/
    editor/
    media/
    posts/[slug]/
    u/[id]/
    api/search/
  components/
    admin/
    dashboard/
    layout/
    media/
    posts/
    profile/
    ui/
  hooks/
  lib/
    supabase/
  services/
  styles/
  types/
  utils/
supabase/
  schema.sql
```

---

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor and run:
   - `supabase/schema.sql`
   - For existing/older projects also run:
     - `supabase/migrations/20260525_production_upgrade.sql`
3. In **Authentication -> Sign In / Providers**:
   - Enable Email provider
   - Enable Google provider (add Client ID + Secret)
4. In **Authentication -> URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/**`
5. In Google Cloud OAuth client, add redirect URI:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`

---

## Environment Variables

Create `.env.local` using `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Important:
- Keep `NEXT_PUBLIC_SITE_URL` set to your active app origin in each environment.

---

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional (Windows): open Chrome directly with:

```bash
npm run dev:chrome
```

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (production domain)
4. Deploy.
5. Add production URL to Supabase Auth redirect URLs.

---

## SQL Highlights

`supabase/schema.sql` includes:
- Tables: `profiles`, `posts`, `comments`, `likes`, `bookmarks`, `follows`, `tags`, `post_tags`, `views`
- FKs + indexes + unique constraints
- Triggers:
  - profile auto-create on signup
  - post `updated_at`
  - likes counter sync
- RPC: `increment_post_views(post_id uuid)`
- Full RLS policies
- Storage bucket + object policies for `post-images`

---

## Notes

- Writers/admins can create posts (`posts_insert_writer_admin` policy).
- Readers can still like/bookmark/comment when authenticated.
- Admin access is role-based (`profiles.role = 'admin'`).

---

## Production Checklist

- [ ] Run schema in Supabase
- [ ] Configure Google OAuth in Supabase + Google Cloud
- [ ] Set Auth URL Configuration for all app domains
- [ ] Ensure a first admin user role is set manually in `profiles`
- [ ] Add your production domain in `NEXT_PUBLIC_SITE_URL`
- [ ] Deploy to Vercel
