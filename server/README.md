# Server-Side Moderation

This folder contains the server-side moderation logic for the PubNub chat demo.

## What's included

- `pubnub-function.js` — A PubNub Function that runs **before every publish** event. It enforces rate limiting (anti-flood) and masks/blocks profanity.
- `README.md` — This file.

## How it works

When a user sends a chat message, the PubNub Function intercepts it on PubNub's edge network before it reaches other users.

### Anti-flood

Each user (`uuid`) is rate-limited to one message every **2 seconds**. If a user sends messages faster than that, the extra messages are dropped.

### Profanity filter

The function fetches a profanity word list from an online database (the LDNOOBW list on GitHub) and caches it in PubNub's KV store for one hour. If the online list cannot be reached, a small fallback list is used. Messages are checked against this list and bad words are masked with asterisks (e.g. `****`). You can also configure the function to drop those messages entirely.

### Message length

Messages longer than **1000 characters** are rejected.

## Setup

1. Open the [PubNub Dashboard](https://admin.pubnub.com/).
2. Select your keyset and go to **Functions**.
3. Create a new Function module.
4. Add an **On Before Publish** event handler.
5. Copy the contents of `pubnub-function.js` into the editor.
6. Save and start the function module.
7. Publish a test message from the chat UI to verify moderation.

## Client-side fallback

`chat.js` also includes lightweight client-side rate limiting and profanity masking. This provides immediate feedback in the browser, but the PubNub Function is the authoritative layer because client-side code can be bypassed.

## Customization

Edit the `CONFIG` object at the top of `pubnub-function.js` to change:

- `cooldownSeconds` — seconds between messages from the same user
- `maxMessageLength` — maximum allowed message length
- `blockProfanity` — `true` to drop bad messages, `false` to mask
- `onlineListUrl` — URL of the online profanity word list
- `listCacheSeconds` — how long to cache the fetched list in KV store
- `fallbackBadWords` — array used when the online list cannot be fetched
