# lost.pink

A shrine you gift. Type a name, dress it (look, font, two photos, one line), publish at `/yourword`. Free for 48 hours. **$5** keeps the name forever.

Looks freeze at publish. Keep is the slug, not extra skins. No accounts.

## Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without env vars, pages save to `.data/pages.json` and photos to `.data/images/` (served at `/api/images/...`). Polar is skipped; keep is instant.

Try: pick a font, add a background + token photo, write a line, publish. On the shrine, tap **Found this**, remix, **Keep this name · $5**, and **Save 9:16**.

## Production

1. Copy `.env.example` → `.env.local` / Vercel env
2. Run `supabase/migration.sql` in your Supabase project (pages columns + `shrine-images` storage bucket)
3. Create a one-time **$5** product in [Polar](https://polar.sh) and set `POLAR_PRODUCT_KEEP`
4. Point Polar webhook to `https://lost.pink/api/webhooks/polar`
5. Add domain `lost.pink` on Vercel

Daily cron `/api/cron/expire` deletes expired free pages **and** their photos. Kept pages keep files.

## Promo

Record a 15s screen capture: type a name → dress the shrine → pink reveal → copy link.
