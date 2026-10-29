# UniHive // Campus Electronics & Hardware Sharing Hub

> **A campus equipment and electronics locker platform for sharing college hardware, microcontrollers, sensor kits, and batteries with physical chain-of-custody QR handovers, council volunteer inventory management, and direct administrative project allotments.**

---

## ⚡ What is UniHive?

UniHive bridges the gap between college hardware lockers (Arduinos, ESP32s, Raspberry Pis, 3D printing coils, LiPo batteries, oscilloscopes) and student project teams.

1. **Role-Based Architecture:**
   - **Students:** Browse live component availability with real circuit graphics, submit loan requests, track chain-of-custody, and earn trust ratings.
   - **Council Volunteers:** Technical council members add/remove components from the locker catalog, review requests, and execute physical check-outs and returns.
   - **Administrators:** Central faculty/deans with **exclusive authority to directly allot components** to student teams for innovation projects and capstone research, bypassing waiting queues.
2. **MediaWiki Imageinfo API Integration (`API:Imageinfo`):**
   - Live hardware product photos dynamically fetched via the [Wikimedia Commons Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo).
   - Displays authentic component photography with proper Creative Commons licensing badges (`CC BY 2.0`, `CC BY-SA 4.0`, `CC0`) and author attributions.
   - Dual-view toggle on component pages allowing users to switch between **📷 Real Photo (Wikimedia)** and **⚡ Circuit Schematic (SVG)**.
   - Built-in live image search tool for Council Volunteers adding new hardware to the locker.
   - Graceful offline fallback to custom vector SVG schematics.
3. **Physical Chain-of-Custody (QR Handover):**
   - Borrowers and council volunteers verify equipment state at pickup and return with cryptographic tokens and vector QR passes.
4. **Direct Administrative Allotment:**
   - Exclusive feature for administrators to allot high-priority components directly to students with instant confirmation tokens.
5. **High-Contrast Dark Mode & Default Light Mode:**
   - Default clean notebook cream theme with a dedicated high-contrast dark theme engineered for maximum legibility and accessibility (WCAG AAA compliant text tokens).

---

## 🔐 Preset Evaluation Credentials

| System Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@unihive.edu` | `Admin@UniHive2026!` | **Direct Student Allotment**, Add/Remove Components, User Governance, CSV Audit Export |
| **Council Volunteer** | `volunteer@unihive.edu` | `Volunteer@UniHive2026!` | Add/Remove Components, Approve/Reject Requests, QR Handover Checkouts & Returns |
| **Student** | `student@unihive.edu` | `Student@UniHive2026!` | Browse Inventory & Real Graphics, Request Loans, View Custody Passes |

*(You can also register new Student or Council Volunteer accounts anytime via the Signup page).*

---

## 🏗 Architecture & Stack

- **Stack:** Pure Vanilla JavaScript (ES Modules), Semantic HTML5, and Neo-Brutalist CSS3.
- **Zero Build Step:** Runs directly in any modern browser without npm, node, or bundlers.
- **Client-Side Cryptography:** Password hashing using Web Crypto API (`SHA-256`).
- **Data Layer (`js/store.js`):** Asynchronous storage layer with `localStorage` persistence and fallback in-memory database.
- **Rules Engine (`js/rules.js`):** Pure functional state machine for permissions, conflict resolution, and trust scoring.
- **PWA Ready:** Includes `manifest.json` and `sw.js` offline cache service worker.

```
UniHive/
├── index.html                   # Semantic HTML5 shell & View Transitions root
├── manifest.json                # PWA manifest
├── sw.js                        # Offline service worker cache
├── netlify.toml                 # Static deployment configuration
├── .github/workflows/deploy.yml # GitHub Pages automated deployment
├── css/
│   ├── tokens.css               # Neo-brutalist color tokens & high-contrast dark mode
│   ├── base.css                 # 24px dot grid, typography & accessibility
│   ├── components.css           # Buttons (.btn-brut), cards, stickers, toasts, dark mode overrides
│   ├── pages.css                # Collage, calendar grid, impact layout
│   └── motion.css               # View Transitions & reduced-motion queries
├── js/
│   ├── app.js                   # Application bootstrapper & hash router
│   ├── auth.js                  # Authentication, SHA-256 hashing & session guards
│   ├── media.js                 # MediaWiki Imageinfo API integration & image search
│   ├── store.js                 # Async storage, CRUD operations & CSV exports
│   ├── rules.js                 # Pure functional rules engine & trust scoring
│   ├── seed.js                  # Electronics components, SVG circuit art & preset users
│   ├── qr.js                    # Vector SVG QR generator & camera scanner
│   ├── ui.js                    # Toast system, theme toggle (default light) & counters
│   └── views/                   # Route views
│       ├── explore.js           # Noticeboard catalog & live search
│       ├── login.js             # Authentication login with quick-fill presets
│       ├── signup.js            # Student & Council Volunteer registration
│       ├── volunteer.js         # Council Volunteer component & handover ops
│       ├── admin.js             # Exclusive Direct Allotment & inventory governance
│       ├── resourceDetail.js    # Component specs, 7-day calendar & request flow
│       ├── myBookings.js        # Handover stepper, QR pass & inspection logs
│       ├── incidents.js         # Human review resolution desk
│       ├── activity.js          # Day-grouped immutable audit log
│       ├── impact.js            # Sustainability metrics & CO2 avoidance
│       └── notifications.js     # User update stream
└── assets/                      # Vector SVG icons & graphics
```

---

## 🚀 How to Run Locally

### 1-Click Startup (Recommended)
Run the automated startup script:

```bash
python start.py
```
This automatically selects an available port, ensures proper JavaScript module MIME types, launches UniHive in your default browser, and displays preset credentials in the terminal.

### Alternative Options
```bash
# Python simple server
python -m http.server 8000

# Node npx
npx serve .
```

Open your browser to:
- **Application:** `http://localhost:8000/`

---

## ⏱ Quick Evaluation & Testing Tour (3 Minutes)

1. **Catalog View (`#/`):**
   - Check available electronics hardware (Arduino, ESP32, Raspberry Pi, Toroid Coils, LiPo Batteries, Oscilloscopes) with real vector illustrations in clean light mode by default.
2. **Toggle Dark Mode:**
   - Click `☾ DARK` in the top right to verify the high-contrast slate and crisp white/slate text styling.
3. **Admin Allotment (`#/admin`):**
   - Sign in as Admin (`admin@unihive.edu` / `Admin@UniHive2026!`).
   - Use the **Direct Student Allotment** console to immediately assign a component to student Maya Chen for the capstone robotics project.
4. **Council Volunteer Ops (`#/volunteer`):**
   - Sign in as Council Volunteer (`volunteer@unihive.edu` / `Volunteer@UniHive2026!`).
   - Click **+ Add New Component** to register new hardware into the locker.
   - Use the **Remove** button to take obsolete components out of circulation.
   - Review pending requests and conduct physical check-outs/returns.
5. **Student Experience (`#/my-bookings`):**
   - Sign in as Student (`student@unihive.edu` / `Student@UniHive2026!`).
   - View the active loan, the **⚡ ADMIN ALLOTTED** badge, and the digital QR pass.
