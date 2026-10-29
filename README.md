# CampusShare // Accountable Equipment Lending Network

> **A Neo-Brutalist campus noticeboard and accountability platform for sharing high-value college gear with zero bureaucracy, physical QR chain-of-custody handovers, and human-first governance.**

---

## ⚡ What is CampusShare?

CampusShare bridges the gap between idle departmental equipment (oscilloscopes, cinema cameras, drones, 3D printers, workstations) and student project demand. 

Instead of paper sign-out binders or rigid rental software, CampusShare provides:
1. **Physical Chain-of-Custody (QR Handover):** Borrowers and custodians verify equipment state at pickup and return with cryptographic tokens and SVG QR passes.
2. **Pre- & Post-Use Inspection Logs:** Photo evidence and condition assessments protect students from unfair blame.
3. **The Human-Review Guarantee:** Damage or delays never trigger algorithmic penalties or automated fines; all incidents invite collaborative human dialogue with lab directors.
4. **Advisory Lender Trust Ratings:** On-time returns unlock higher trust tiers (Newcomer → Reliable → Trusted → Campus Legend) with instant auto-approval on open-access gear.
5. **Interactive 7-Day Availability Grid:** Live calendar slots with click-to-select reservations and conflict detection.
6. **Campus Sustainability & Impact:** Real-time counters showing shared usage, estimated student cost savings, and avoided manufacturing CO2 emissions.

---

## 🏗 Architecture & Stack

- **Stack:** Pure Vanilla JavaScript (ES Modules), HTML5, and CSS3.
- **Zero Build Step:** Runs directly in any modern browser without npm, node, or webpack.
- **Zero External Dependencies:** Built with zero runtime frameworks. Uses client-side vector SVG QR generation and browser-native APIs (`BarcodeDetector`, `View Transitions API`, `IntersectionObserver`, `Canvas`).
- **Data Layer (`js/store.js`):** Asynchronous storage layer with `localStorage` persistence and fallback in-memory database.
- **Rules Engine (`js/rules.js`):** 100% pure functional state machine with comprehensive unit test coverage.
- **PWA Ready:** Includes `manifest.json` and `sw.js` offline cache service worker.

```
CampusShare-main/
├── index.html                   # Semantic HTML5 shell & View Transitions root
├── manifest.json                # PWA manifest
├── sw.js                        # Offline service worker cache
├── netlify.toml                 # Netlify deployment configuration
├── .github/workflows/deploy.yml # GitHub Pages automated deployment
├── css/
│   ├── tokens.css               # Neo-brutalist color tokens, borders, and shadows
│   ├── base.css                 # 24px dot grid, typography & accessibility
│   ├── components.css           # Buttons (.btn-brut), cards, stickers, toasts
│   ├── pages.css                # Collage, calendar grid, impact layout
│   └── motion.css               # View Transitions & reduced-motion queries
├── js/
│   ├── app.js                   # Application bootstrapper & hash router
│   ├── store.js                 # Async storage, CRUD operations & CSV exports
│   ├── rules.js                 # Pure functional rules engine & trust scoring
│   ├── seed.js                  # 15 assets, 12 users, 34 bookings, 3 incidents
│   ├── qr.js                    # Vector SVG QR generator & camera scanner
│   ├── ui.js                    # Toast system, theme toggle & counters
│   └── views/                   # Route views
│       ├── explore.js           # Noticeboard catalog & live search
│       ├── resourceDetail.js    # 7-day calendar, tabs & smart hints
│       ├── myBookings.js        # Handover stepper, QR pass & photo evidence
│       ├── ownerDashboard.js    # Custodian ops, overdue alerts & QR scanner
│       ├── incidents.js         # Human review resolution desk
│       ├── activity.js          # Day-grouped immutable audit log
│       ├── impact.js            # Sustainability metrics & 30-day SVG chart
│       ├── admin.js             # User certification & inventory management
│       └── notifications.js     # User update stream
├── assets/                      # Vector SVG icons & graphics
└── tests/
    └── rules.test.html          # Automated browser test suite
```

---

## 🚀 How to Run Locally

Because CampusShare is a static web application, you can run it with any local static server:

```powershell
# Option 1: Python 3
python -m http.server 8000

# Option 2: Node npx
npx serve .
```

Open your browser to:
- **Application:** `http://localhost:8000/`
- **Rules Unit Test Suite:** `http://localhost:8000/tests/rules.test.html`

---

## 🌐 How to Deploy in 30 Seconds

1. **Netlify Drop:** Drag and drop this folder directly into [Netlify Drop](https://app.netlify.com/drop).
2. **GitHub Pages:** Push to your repository and select **Settings > Pages > Deploy from branch (main / root)**.
3. **Vercel:** Run `vercel deploy` or import the GitHub repository.

---

## ⏱ The 3-Minute Live Judge Journey

| Elapsed | Persona | Screen & Action | Key Message / Hackathon Beat |
| :--- | :--- | :--- | :--- |
| **0:00** | Intro | Noticeboard Hero (`#/`) | *"A $1,500 oscilloscope sits idle in Room 204 while students struggle to buy their own. CampusShare unlocks campus hardware with accountability."* |
| **0:25** | Student (Maya) | Resource Detail (`#/resource/4`) | Open Sony Cinema Rig. Demonstrate the **7-Day Availability Grid**; click a green slot to automatically populate the booking window. |
| **0:50** | Student (Maya) | Resource Detail (`#/resource/4`) | Submit request. Point out **Instant Auto-Approval** triggered by Maya's *Trusted* standing (Trust Score: 50+). |
| **1:15** | Student (Maya) | My Loans (`#/my-bookings`) | Review the 6-stage handover stepper. Log pre-handover condition with photo inspection. Reveal the **Digital QR Handover Pass**. |
| **1:40** | Owner (Dr. Miller) | Custodian Ops (`#/owner`) | Switch persona in navbar. Notice the red **Overdue Equipment Alert** (Marcus Vance's overdue oscilloscope). Click **📷 Scan Handover QR Pass** and enter token `CS-QR-BK2-3419` to complete handover in 1 click! |
| **2:10** | Owner / Student | Incidents Desk (`#/incidents`) | Show resolved damage incident. Emphasize: *"No automatic fines or credit penalties. Humans review the report, agree on learning outcomes, and preserve trust."* |
| **2:35** | Dean (Alice) | Impact Dashboard (`#/impact`) | View real-time counters: completed loans, department financial savings, avoided manufacturing CO2, and the 30-day SVG activity graph. |
| **2:50** | Admin | Admin Console (`#/admin`) | Show instant CSV export of audit events and user certification grants. |

---

## 📋 Pre-Seeded Hackathon Personas

Switch between personas in the top-right navbar pill or with the quick-switch bar on the home screen:

1. **Maya Chen** (`Student`): Certified in Electronics & 3D Printers. High trust score (50+ pts), eligible for instant auto-approvals.
2. **Marcus Vance** (`Student`): Has an active overdue loan (Digital Storage Oscilloscope) and past resolved incident for inspection.
3. **Dr. Aris Miller** (`Custodian / Owner`): Engineering Makerspace Director. Manages oscilloscopes, FPGA boards, and 3D printers.
4. **Sarah Jenkins** (`Custodian / Owner`): Media Center Coordinator. Manages cinema cameras, audio rigs, and drones.
5. **Dean Alice Cooper** (`Administrator`): Global facilities supervisor. Grants training certifications, archives assets, and exports audit CSVs.

---

## 🧪 Specification Unit Tests

The test suite at [`tests/rules.test.html`](file:///c:/A%20folder/Code%20Projects/SIH/CampusShare-main/tests/rules.test.html) asserts the correctness of all functional business rules:
- [x] Date range overlap detection and slot boundary conditions
- [x] Automatic waitlist placement on schedule conflict
- [x] Auto-promotion of the oldest compatible waitlisted request upon cancellation or return
- [x] Fair-use limit enforcement (max 3 active bookings per student)
- [x] Training gate authorization for certified vs. non-certified categories
- [x] Condition inspection report enforcement prior to checkout and return
- [x] Overdue equipment calculation
- [x] Advisory trust score updates (+10 good, +3 minor issue, -10 late, -15 confirmed damage)
- [x] Human review governance principles

---

## 🤝 Contribution & AI Assistance Disclosure

- **AI Assistance:** Gemini Advanced Agentic Coding Assistant was utilized for scaffold refactoring, pure function business rules extraction from the Flask reference, Neo-Brutalist CSS tokens authoring, and test assertions generation.
- **Human Verification:** All business logic, state machines, permission checks, and mobile responsiveness were independently reviewed and verified.
