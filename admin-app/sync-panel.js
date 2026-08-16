const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'dezire-backend', 'admin-panel.html');
const DEST = path.join(__dirname, 'www', 'index.html');
const API_URL = 'https://dezire-more-website-1.onrender.com/api';

let html = fs.readFileSync(SOURCE, 'utf8');

if (!html.includes("const API = '/api';")) {
  console.error(
    "Could not find \"const API = '/api';\" in admin-panel.html — it may have moved or been reworded.\n" +
    'Update this script (or apply the API-URL edit by hand) before syncing.'
  );
  process.exit(1);
}

html = html.replace(
  "const API = '/api';",
  `// Absolute URL, not the '/api' relative path the browser-served version at
// dezire-backend/admin-panel.html uses — that only works same-origin, and
// there's no "origin" at all once this runs as a packaged native app (no
// backend living at a relative path locally). Points straight at the real
// deployed backend instead. If you ever move off Render, update this.
const API = '${API_URL}';`
);

fs.writeFileSync(DEST, html);
console.log(`Synced ${SOURCE} -> ${DEST} (API URL patched to ${API_URL})`);
console.log('Now run: npx cap sync');
