# PubNub Chat Channel Presence — Relaunched

A real-time group chat demo powered by [PubNub](https://www.pubnub.com/) with live presence (join/leave/occupancy). Originally built by PubNub, now relaunched with a modern login flow, GitHub avatars, responsive scaling, and HTTPS support.

**Try it live:** [Cloudflare Pages Demo](https://pubnub-chat-channel-presence.pages.dev)

---

## ✨ What's New

- **Username login** — No more Twitter authentication. Just type a name and join.
- **GitHub avatars** — Avatars are loaded from `avatars.githubusercontent.com` using the username.
- **Responsive scaling** — The 1024×768 layout proportionally scales to fit any screen (desktop, tablet, phone).
- **HTTPS everything** — All resources load over HTTPS. No more mixed-content errors.
- **Cloudflare Pages ready** — Deploy in one click via Cloudflare Pages. Includes `_headers` for security headers.

## Features

- Real-time group chat via PubNub
- Live presence — see who's online/offline
- Join and leave event feed
- GitHub avatar support
- Responsive design
- Open source (MIT License)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Looons404/pubnub-chat-channel-presence.git
cd pubnub-chat-channel-presence
```

### 2. Add your PubNub keys

Open **`chat.js`** and add your publish and subscribe keys to the `ready()` function:

```javascript
p = p.init({
    publish_key   : 'YOUR_PUBLISH_KEY',
    subscribe_key : 'YOUR_SUBSCRIBE_KEY',
    ssl           : true,
    cipher_key    : '',
    uuid          : ''+user.uuid
});
```

Get free API keys at [PubNub Dashboard](https://admin.pubnub.com/).

### 3. Open locally

Just serve the folder with any static server:

```bash
npx serve .
```

Or open `index.html` directly in a browser.

### 4. Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages).
3. Click **Create a project** → **Connect to Git**.
4. Select your repo.
5. Set **Build command** to empty (leave blank — this is a static site).
6. Set **Build output directory** to `/` (root).
7. Click **Deploy**.

That's it — Cloudflare will auto-deploy on every push.

---

## Project Structure

| File | Description |
|------|-------------|
| `index.html` | Main page layout and templates |
| `default.css` | All styling (responsive wrapper, login form, chat UI) |
| `chat.js` | Chat logic, PubNub integration, login flow |
| `pubnub-3.2.js` | PubNub JavaScript SDK (v3.2, ) |
| `animate.js` | CSS animation helpers |
| `sound.js` | Chat notification sound |
| `_headers` | Cloudflare Pages security headers |

---

## License

MIT — do whatever you want with it.

Original PubNub demo: [github.com/pubnub/pubnub-chat-channel-presence](https://github.com/pubnub/pubnub-chat-channel-presence)
