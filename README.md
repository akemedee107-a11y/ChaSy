# ChaSy

ChaSy is a small chat-system workshop built with plain HTML, CSS, and JavaScript. Messages are stored in the browser with `localStorage`, so no backend, database, or API key is required.

## Features

- Send messages as one of three demo members
- Store up to 100 messages locally
- Synchronize messages between tabs in the same browser
- Clear chat history
- Responsive desktop and mobile layout
- Ready for GitHub Pages

## Run locally

Open `index.html` directly, or run a static server:

```bash
npx serve .
```

## Limitation

This workshop version stores messages only on the current device. Different browsers or devices cannot chat with each other without adding a backend or realtime database.
