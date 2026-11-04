# EVENTO

### Discover Events. Connect with People. Create Experiences.

EVENTO is a frontend-only event discovery and management platform. Students can explore events, register, and manage their digital QR code tickets — all stored in the browser with no backend required.

## Features

- Event discovery and browsing with mock data
- Search and category filters (Technology, Arts, Business, Music, Sports)
- Event detail modal
- Event registration (stored in `localStorage`)
- My Registered Events dashboard
- Digital QR code tickets with PDF download
- Organizer dashboard with QR scanner and manual check-in
- Mock authentication (sign up / login stored in `localStorage`)
- Profile management with photo upload
- Light and Dark themes
- Fully responsive UI

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript (no frameworks, no build tools)
- [jsPDF](https://github.com/parallax/jsPDF) — PDF ticket generation
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — QR scanner on organizer dashboard
- [QR Server API](https://goqr.me/api/) — QR code image generation

## Project Structure

```text
EVENTO/
├── frontend/
│   ├── index.html          ← Main event discovery page
│   ├── profile.html        ← User profile, registrations & tickets
│   ├── organizer.html      ← Organizer QR scanner dashboard
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── events.js       ← Mock event data (edit here to add/change events)
│       ├── main.js         ← Event listing, registration, ticket modals
│       ├── profile.js      ← Mock auth, profile, ticket passes
│       ├── organizer.js    ← QR scanner & check-in logic
│       └── theme.js        ← Light / dark theme toggle
└── README.md
```

## Running the Project

No installation or server required — open directly in a browser.

**Option 1 — VS Code Live Server**
1. Open the project folder in VS Code.
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3. Right-click `frontend/index.html` → **Open with Live Server**.

**Option 2 — Double-click**
Open `frontend/index.html` directly in any modern browser.

> **Note:** The QR scanner on the organizer dashboard requires a camera-enabled device and HTTPS (or `localhost`) to access the camera.

## How Mock Data Works

All data lives in the browser — nothing is sent to a server.

| Storage key | Contents |
|---|---|
| `evento-registrations` | All event registrations + check-in status |
| `evento-mock-users` | Signed-up user accounts |
| `evento-current-user` | Currently logged-in user session |
| `evento-profiles` | Profile names and photos |
| `evento-theme` | Saved light/dark preference |

To add or edit events, update the `window.EVENTO_EVENTS` array in `frontend/js/events.js`.

## Pages

| Page | Description |
|---|---|
| `index.html` | Browse events, register, view tickets |
| `profile.html` | Login/signup, view registrations, download PDF tickets |
| `organizer.html` | Scan QR codes, manual check-in, view stats |

---

Made with ❤️ for EVENTO.
