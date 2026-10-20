# STASH — Publish & Launch Guide

See also: **`/Users/sarvik/Desktop/STASH-PUBLISH-GUIDE.md`** (same content, saved on your Desktop)

Everything you need to go live on free tiers and start using STASH yourself.

---

## Quick checklist

- [ ] Create Supabase + Vercel + Anthropic accounts
- [ ] `supabase link` → `supabase db push` → `supabase secrets set ANTHROPIC_API_KEY=...`
- [ ] `supabase functions deploy classify-posts`
- [ ] Deploy `apps/web` to Vercel (set root directory to `apps/web`)
- [ ] Set env vars on Vercel (see guide)
- [ ] Load extension from `apps/extension/dist`, copy Extension ID to Vercel
- [ ] Connect extension from dashboard → sync Instagram Saved

Full step-by-step: open **`STASH-PUBLISH-GUIDE.md`** on your Desktop.
