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

`public/` is plain static files, so any static host works. The included `compose.yaml`
runs Caddy serving `public/`, meant to sit behind a Cloudflare Tunnel so the server opens
no ports. Server-specific settings go in `compose.override.yaml`, which is git-ignored and
picked up automatically by `docker compose`.

### Using a tunnel you already run

Clone the repo on the server, then add a `compose.override.yaml` depending on how
`cloudflared` runs there.

**`cloudflared` installed on the host** (e.g. a systemd service):

```yaml
services:
  web:
    ports:
      - "127.0.0.1:8080:8080"   # localhost only, not exposed publicly
```

Route the hostname to `http://localhost:8080`.

**`cloudflared` running in Docker:** join the network it uses
(`docker inspect <container> --format '{{json .NetworkSettings.Networks}}'`):

```yaml
services:
  web:
    networks:
      default:
      tunnel:
        aliases: [secret-santa]
networks:
  tunnel:
    external: true
    name: <cloudflared network>
```

Route the hostname to `http://secret-santa:8080`.

Then start it with `docker compose up -d` and add the public hostname to the tunnel in the
Cloudflare dashboard (Networks → Tunnels → your tunnel → Add route). Cloudflare creates the
DNS record.

### Using a dedicated tunnel

1. Cloudflare dashboard: Networks → Tunnels → **Create a tunnel** → Cloudflared. From the
   install step, copy the token (the long string after `--token`).
2. Add a public hostname with service type `HTTP` and URL `web:8080`.
3. On the server:

   ```sh
   git clone <this repo>
   cd secret-santa
   echo "TUNNEL_TOKEN=<token>" > .env
   docker compose --profile tunnel up -d
   ```

Either way, check that the site shows the cabin. Don't test with a real link, since that
spoils a match.

### After a new draw

On the server:

```sh
cd secret-santa && git pull
```

Caddy serves the folder directly, so no restart is needed. The page and `data.js` are sent
with `Cache-Control: no-cache`, so Cloudflare won't serve an old draw.
