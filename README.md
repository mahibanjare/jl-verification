# JL Verify — FI / CPV Verification

Field Investigation / Contact Point Verification app for **Jain & Lunkad, Chartered Accountants**.
React + Vite + Tailwind, with a Google Sheet (via Apps Script) as the backend.

👉 **Setup: [SETUP-GUIDE.md](SETUP-GUIDE.md)**

## What's inside

| Area | Where |
|---|---|
| Unified data model (field form = review = PDF) | `src/lib/sections.js` |
| Auto-generated report comments | `src/lib/comments.js` |
| Validation rules (block contradictions) | `src/lib/validation.js` |
| Field executive mobile stepper + GPS camera | `src/pages/FieldCase.jsx`, `src/components/Photos.jsx` |
| Review / approve / send back | `src/pages/CaseDetail.jsx` |
| A4 letterhead report → PDF | `src/pages/Report.jsx` + report CSS in `src/index.css` |
| Dashboard, TAT, filters | `src/pages/Dashboard.jsx`, `src/pages/Cases.jsx` |
| Allocation + CSV bulk upload | `src/pages/Allocate.jsx` |
| Users, roles, settings, Email + Telegram alerts | `src/pages/Users.jsx`, `src/pages/Settings.jsx`, `src/pages/Profile.jsx` |
| Backend (auth, roles, sessions, notifications, triggers) | `google-apps-script/Code.gs` |
| Masters config (Clients, Branches) | `src/app.config.json` |

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run gen-db   # optional: JL-Verify-Database.xlsx
```
