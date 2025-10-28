This folder is a static snapshot of https://kjs-typing-simulator.onrender.com/ downloaded on 2025-10-28.

Changes made:
- Added a 1-minute countdown timer (60s) to the game. When time runs out the game stops and shows the final score.

How to serve locally:

Run a simple HTTP server from the `site-copy/` folder:

```bash
cd site-copy/kjs-typing-simulator.onrender.com
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes:
- This is a static copy (HTML/CSS/JS). The original site may have dynamic backend functionality not included here.
- I modified `script.js` to enable a 60-second countdown and a simple end-of-game overlay message.
