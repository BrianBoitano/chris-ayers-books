# chrisayersbooks.com

Author hub for Christopher Ayers. Astro 5 static site on Vercel.

## Add a work
Drop a markdown file in `src/content/works/<slug>.md` (see schema in
`src/content/schema.ts`). Set `externalUrl` to link out instead of hosting.
For a hosted series, add books in `src/content/books/<slug>.md` with `work: <work-slug>`.
Flip `status` locked -> coming-soon -> live. Push. The tile, page, sitemap, and SEO generate automatically.

## Develop
- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

## Email list
The `/api/subscribe` endpoint stores to Upstash Redis when
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set in Vercel; it
degrades to disabled when unset. Export the CSV with `SUBSCRIBE_ADMIN_TOKEN`.
