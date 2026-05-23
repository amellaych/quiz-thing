# Quiz Thing

A live, multiplayer Kahoot-style quiz platform. Teachers build quizzes with
images, timers, and multi-correct answers; students join from any phone or PC
with their own avatar.

## Run it

```bash
npm install
npm run dev
```

The server prints three URLs on boot:

```
> Quiz Thing ready on http://0.0.0.0:3000
> LAN access:  http://192.168.1.42:3000
> Tip: set PUBLIC_URL to your tunnel URL so players can join from anywhere.
```

- **`http://localhost:3000`** — for you (the host) on this machine
- **`LAN access`** — works for any device on the **same Wi-Fi**
- **`PUBLIC_URL`** — a tunnel URL that works **from anywhere on the internet**

The host's lobby page generates a join link + QR code from the most public URL
available, so just pick the option you need.

---

## Letting anyone join (mobile or PC, anywhere)

Pick **one** of these — listed easiest first.

### Option A — Same Wi-Fi only (zero setup)

If everyone (you + your students) is on the same network, just use the LAN URL
the server prints. Players scan the QR code or visit the URL on their phone.

This is perfect for a classroom or office where everyone shares Wi-Fi.

### Option B — Anywhere on the internet via a tunnel (recommended)

A tunnel exposes your local server through a public HTTPS URL. Phones on
cellular data, students at home, anyone — they can all join.

#### 1. Cloudflare Tunnel (free, no signup)

```bash
# Install once (macOS):  brew install cloudflared
# Linux: see https://github.com/cloudflare/cloudflared/releases

# In one terminal:
PUBLIC_URL=$(echo "")  # placeholder — we'll fill it in
npm run dev

# In another terminal:
cloudflared tunnel --url http://localhost:3000
```

`cloudflared` prints something like
`https://random-words.trycloudflare.com`. Stop the dev server, then re-run it
with that URL set:

```bash
PUBLIC_URL=https://random-words.trycloudflare.com npm run dev
```

The host lobby's QR code now points to the public URL. Done.

#### 2. ngrok (free tier)

```bash
# Install: https://ngrok.com/download  (free signup gives you a stable subdomain)
ngrok http 3000
# Copy the https URL it prints, then:
PUBLIC_URL=https://your-subdomain.ngrok-free.app npm run dev
```

#### 3. localtunnel (no install, no signup)

```bash
npx localtunnel --port 3000
# Copy the https URL, then:
PUBLIC_URL=https://your-name.loca.lt npm run dev
```

> **Tip:** WebSockets work on all three. Cloudflare Tunnel is the most reliable
> for free; ngrok gives you a stable URL; localtunnel is the most disposable.

### Option C — Deploy it (most permanent)

Deploy to any Node host (Render, Railway, Fly.io, your own VPS). Two things to
remember:

1. The app uses a **custom Node server** (`server.js`) so Socket.IO works.
   Use `npm run start` as the start command, not `next start`.
2. Set `PUBLIC_URL` to your deployed origin (e.g. `https://quiz.yourdomain.com`).
   This is optional if the host opens the deployed app directly — the QR code
   will pick up the origin from the browser — but it's cleaner to set it.

Vercel won't work out of the box because it doesn't run a long-lived Node
server. If you want Vercel, you'd need to swap the in-memory game store for
something external (Redis or a serverless WebSocket service like Pusher).

---

## How the platform works

- **Teacher (`/host`)** — builds a quiz with images, per-question timer & points,
  single-choice / multi-select / true-false questions
- **Host (`/host/game`)** — shows the 6-digit PIN + join URL + QR code, controls
  the game live, sees per-question stats and final podium
- **Student (`/join` → `/play`)** — joins with PIN/link, picks an emoji avatar
  & nickname, answers questions with speed-based scoring + streak bonuses

## Scoring

- Full points for an instant correct answer, scaling down to half points at
  the very end of the timer
- +50 points per consecutive correct answer (capped at +250)
- Multi-select questions require an exact match of the correct set
