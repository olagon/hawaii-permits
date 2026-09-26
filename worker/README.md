# Ala suggestion worker

A tiny Cloudflare Worker that turns a form post into a GitHub issue, so people without GitHub accounts can report changes.

Not deployed yet. To deploy: `npm i -g wrangler`, `wrangler login`, create a fine grained GitHub token with Issues write on `olagon/ala`, `wrangler secret put GITHUB_TOKEN`, `wrangler deploy`. Then set `WORKER_URL` in `app/src/components.js`.

Test locally: `npx wrangler dev` then

```sh
curl -X POST http://localhost:8787 -H 'Content-Type: application/json' -d '{"kind":"change","place_name":"Test","details":"Fee changed"}'
```
