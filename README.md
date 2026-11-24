# Hemliga tomten

A tiny static Secret Santa site in Swedish: ASCII cabin, falling ASCII snow, no build step
and no backend.

Each participant gets a personal link (`https://your-site/#token`). The page only reveals
their match when opened with that token; the pairings in `public/data.js` are obfuscated,
so they can't be read from the source. It's an honour system, not real security: whoever
holds `links.txt` can open every match.

## Draw names

Participants are hardcoded in `draw.js`. Pass the address the site will be served from:

```sh
node draw.js https://santa.example.com/
git add public/data.js && git commit -m "New draw" && git push
```

You can also set `SITE_URL` instead of passing the address as an argument.

This shuffles (nobody gets themselves), writes `public/data.js` and prints one link per
person, also saved to `links.txt`. Running it again makes a completely new draw, and old
links stop working.

`links.txt` is git-ignored and must never be committed. Send each link privately to the
right person without opening it, then delete the file or keep it somewhere safe.

## Run locally

```sh
npm run serve   # http://localhost:8000
```

ES modules need a real HTTP server, so opening `index.html` directly from disk won't work.

## Deploy

`public/` is plain static files, so any static host works. The included `compose.yaml` runs
it behind a Cloudflare Tunnel, so the server opens no ports: one container runs Caddy
serving `public/`, the other runs `cloudflared` connecting it to Cloudflare.

### One-time setup

1. Cloudflare dashboard: Zero Trust → Networks → Tunnels → **Create a tunnel** → Cloudflared.
   From the install step, copy the token (the long string after `--token`).
2. In the tunnel, add a public hostname for your domain with service type `HTTP` and URL
   `web:8080`. Cloudflare creates the DNS record.
3. On the server:

   ```sh
   git clone <this repo>
   cd secret-santa
   echo "TUNNEL_TOKEN=<token>" > .env
   docker compose up -d
   ```

4. Check that the site shows the cabin and that the tunnel is **Healthy** in the dashboard.
   Don't test with a real link, since that spoils a match.

If the server already runs a tunnel for other sites, reuse it instead: remove the `tunnel`
service, add `ports: ["127.0.0.1:8080:8080"]` to `web`, and point the hostname at
`http://localhost:8080`. The port is bound to localhost only, so it isn't exposed publicly.

### After a new draw

On the server:

```sh
cd secret-santa && git pull
```

Caddy serves the folder directly, so no restart is needed. The page and `data.js` are sent
with `Cache-Control: no-cache`, so Cloudflare won't serve an old draw.
