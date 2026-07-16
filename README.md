# PubNub Chat Channel Presence — Relaunched

A real-time group chat demo powered by [PubNub](https://www.pubnub.com/) with live presence (join/leave/occupancy). Originally built by PubNub, now relaunched with a modern login flow, GitHub avatars, responsive scaling, and HTTPS support.

~~I CAN'T DO THIS ANYMORE, when I make it public, people find vulneranilities, when I fix them, people swear or spam. I'm done fixing this, you can still use it personally but I'm done with the demo~~ A demo is being worked on by me
---


## Features
## ✨ What's New

- **Username login** — No more Twitter authentication. Just type a name and join.
- **GitHub avatars** — Avatars are loaded from `avatars.githubusercontent.com` using the username.
- **Responsive scaling** — The 1024×768 layout proportionally scales to fit any screen (desktop, tablet, phone).
- **HTTPS everything** — All resources load over HTTPS. No more mixed-content errors.

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

Copy the example keys file and add your own publish/subscribe keys:

```bash
cp keys.example.js keys.js
```

Then edit `keys.js` with your keys from the [PubNub Dashboard](https://admin.pubnub.com/):

```javascript
const KEYS = {
    publish_key   : 'YOUR_PUBLISH_KEY',
    subscribe_key : 'YOUR_SUBSCRIBE_KEY'
};
```

**Security note:** `keys.js` is listed in `.gitignore` and will not be pushed to GitHub. However, because this is a client-side demo, the keys are still visible in the browser to anyone using the app. For a public deployment, enable [PubNub Access Manager (PAM)](https://www.pubnub.com/docs/general/security/access-manager) to restrict access.

### 3. Open locally

Just serve the folder with any static server:

```bash
npx serve .
```

Or open `index.html` directly in a browser.

### 4. Deploy

Push this repo to any static hosting provider (Cloudflare Pages, Netlify, Vercel, etc.) — no build step needed.

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
| `server/pubnub-function.js` | PubNub Function for server-side anti-flood and profanity filtering |


### Server-side moderation

This demo now includes a PubNub Function (`server/pubnub-function.js`) that intercepts every publish event on PubNub's edge network to enforce:

- **Anti-flood:** one message per user every 2 seconds
- **Profanity filter:** masks or blocks configurable bad words
- **Message length limit:** 1000 characters

See [`server/README.md`](server/README.md) for setup instructions.

---

## License

MIT — do whatever you want with it.

Original PubNub demo: [github.com/pubnub/pubnub-chat-channel-presence](https://github.com/pubnub/pubnub-chat-channel-presence)
