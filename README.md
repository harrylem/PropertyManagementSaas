
**Property Management SaaS**

A modern property management platform built for the Greek market. It automates the calculation and distribution of shared building expenses, replaces the Excel spreadsheets and handwritten notes that most Greek building managers still rely on, and gives tenants a clear view of what they owe and why.

This repository contains the **v1 interactive prototype** — a fully navigable, 9-page UI built as a single HTML file with Tailwind CSS, ready to deploy to Vercel in under a minute.

---

## Table of Contents

- [What v1 Can Do](#what-v1-can-do)
- [Pages Walkthrough](#pages-walkthrough)
- [Business Logic](#business-logic)
- [Mock Data](#mock-data)
- [Design System](#design-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deploying to Vercel](#deploying-to-vercel)
- [Database Schema (Preview)](#database-schema-preview)
- [Roadmap: What's Next](#roadmap-whats-next)

---

## What v1 Can Do

This prototype is a **clickable, data-driven UI** that demonstrates the full scope of the product. Everything is rendered dynamically from a central JavaScript data object, which means the architecture is already structured to swap in real Supabase queries later with minimal refactoring.

**Included in v1:**

- Full sidebar navigation with 3 grouped sections (Core, Management, Analytics)
- 9 interconnected pages, all functional with mock data
- Millesimal-based bill calculation engine (the core business logic)
- Multi-level filtering and live search across pages
- Drill-down navigation (dashboard → building → unit-level bills)
- Tab interfaces for building detail and settings
- Status pipelines for maintenance requests and billing
- Priority system for announcements (urgent/high/normal/low)
- Document repository with category tagging
- Financial charts (income vs expenses, expense category breakdown)
- Settings panel with organization details, billing config, notification toggles, and team management
- Greek language throughout — labels, categories, addresses, names, currency formatting
- Dark theme with a cohesive custom color palette
- Hover states, transitions, and animated progress bars

**Not included in v1 (these are next):**

- No backend — all data is in-memory mock data
- No authentication or user accounts
- No database persistence (Supabase integration is next)
- No real payment processing
- No file uploads or PDF generation
- No email sending
- Buttons like "Νέο Κτίριο" and "Αποθήκευση" are styled but don't trigger forms yet

---

## Pages Walkthrough

### 1. Πίνακας Ελέγχου (Dashboard)

The landing page. Gives the property manager an at-a-glance overview of their portfolio.

- **4 KPI cards**: total buildings, total tenants, pending payments (€), overdue payments (€)
- **Buildings table**: each building shows unit count, occupancy ratio, and outstanding balance. Rows are clickable — they navigate to the building detail page.
- **Recent activity feed**: a chronological list of the latest events across all buildings (new maintenance requests, payments received, announcements posted, issues resolved). Each entry has a color-coded icon by type.

### 2. Κτίρια (Buildings)

A card grid of all managed buildings.

- Each card shows: building name, full address, unit count, floor count, outstanding balance, and feature tags (e.g. "Ασανσέρ", "Κεντρ. Θέρμανση")
- Cards have a hover effect (border highlights blue) and are clickable to drill into the building detail page

### 3. Building Detail (sub-page of Κτίρια)

Accessed by clicking a building from the grid or dashboard. Contains a back button, a header with the building name and address, and 4 stat cards (units, total expenses, collected amount, outstanding amount).

Three tabs:

- **Μονάδες & Ένοικοι**: table of all units sorted by floor. Columns: unit label, floor, square meters, χιλιοστά (millesimal share), tenant name with avatar, occupancy status badge. Empty units show "Κενό" in italic.
- **Έξοδα**: table of the current period's expenses. Columns: category (e.g. "Ηλεκτρικό κοινοχρήστων"), description (e.g. "ΔΕΗ Φεβ 2026"), split method badge, amount. A bold total row at the bottom.
- **Κοινόχρηστα**: the computed bill for each unit. Columns: unit, tenant, χιλιοστά, percentage share, payment status (Πληρώθηκε / Εκκρεμεί / Ληξιπρόθεσμο), amount. This is the output of the bill calculation engine.

### 4. Ένοικοι (Tenants)

A flat directory of all tenants and owners across all buildings.

- **Filter chips**: Όλοι / Ενοικιαστές / Ιδιοκτήτες — toggles between showing everyone, renters only, or owners only
- **Live search**: filters by name or email as you type
- **Table columns**: name (with avatar initial), building, unit, role badge (blue for owner, green for renter), email, phone
- **"Νέος Ένοικος" button**: placeholder for the future create-tenant form

### 5. Κοινόχρηστα (Billing)

Building-level billing overview for the current period.

- One card per building showing: building name, period label, expense count, total amount, paid/total count
- **Animated progress bar**: fills to show the collection rate (e.g. 70% collected)
- Cards are clickable — navigate to the building detail's bills tab

### 6. Ανακοινώσεις (Announcements)

A communication board for posting updates to tenants.

- **Colored left border** per priority: red (Επείγον), orange (Υψηλή), blue (Κανονική), gray (Χαμηλή)
- **Pinned posts** float to top with a pin icon
- **Priority badge** on each announcement
- **Building tag** showing which building the announcement applies to
- **Building filter chips**: show all or filter to a specific building
- **"Νέα Ανακοίνωση" button**: placeholder for the future compose form

### 7. Συντήρηση (Maintenance)

Tracks repair requests through a status pipeline.

- **3 stat cards**: total requests, open (not yet resolved), resolved
- **Dual filter system**: filter by building AND by status independently
- **Status pipeline**: Υποβλήθηκε → Αναγνωρίστηκε → Σε εξέλιξη → Επιλύθηκε (with additional Κλειστό and Ακυρώθηκε states)
- **Table columns**: request title + truncated description, building, unit (or "Κοινόχρ." for common areas), priority label (color-coded), status badge, assigned technician/company, date submitted

### 8. Έγγραφα (Documents)

A repository for building-related files.

- **Dual filters**: building + document category
- **Category badges**: Σύμβαση (contract), Ασφάλεια (insurance), Πρακτικά (minutes), Πιστοποιητικό (certificate)
- **Table columns**: document name with PDF icon, building, category badge, file size, upload date, download button
- **"Ανέβασμα" button**: placeholder for the future file upload flow (will connect to Supabase Storage or Cloudflare R2)

### 9. Αναφορές (Reports)

Financial analytics and performance metrics.

- **4 KPI cards**: monthly revenue (with +/- trend arrow), monthly expenses, collection rate (%), average days to payment
- **Bar chart**: income vs expenses over the last 6 months. Pure CSS — no charting library. Each month shows two bars (green for income, blue for expenses) scaled proportionally to the maximum value.
- **Expense category breakdown**: lists every expense category with a proportional progress bar, absolute amount (€), and percentage of total. Categories are aggregated across all buildings.

### 10. Ρυθμίσεις (Settings)

Configuration panel with 4 tabs:

- **Οργανισμός (Organization)**: form fields for company name, ΑΦΜ (tax ID), ΔΟΥ (tax office), email, phone, address, language selector (Ελληνικά / English). Pre-filled with mock data.
- **Χρεώσεις (Billing)**: default due date (days), currency (EUR, locked), toggle for auto payment reminders (3 days before due), toggle for auto late fees (2% after 30 days), payment methods grid showing status of Stripe, IRIS, bank transfer, and cash.
- **Ειδοποιήσεις (Notifications)**: 4 toggle switches — email notifications, bill reminders to tenants, new maintenance request alerts, payment confirmation emails.
- **Ομάδα (Team)**: member table with avatar, name, email, role (Ιδιοκτήτης / Διαχειριστής / Αναγνώστης), status (Ενεργός / Σε αναμονή). Includes an invite button.

---

## Business Logic

### Bill Calculation (Millesimal Share System)

The core feature of the platform. In Greek apartment buildings, shared expenses are divided among units based on their **χιλιοστά** (millesimal shares) — a legally defined ratio written into the building's founding documents.

The calculation engine works as follows:

```
total_millesimal = sum of all units' millesimal values
unit_share       = unit.millesimal / total_millesimal
unit_bill        = total_expenses × unit_share
```

For example, in a building with total expenses of €1,012.70 and a unit with 85/900 χιλιοστά:

```
share = 85 / 900 = 9.44%
bill  = €1,012.70 × 0.0944 = €95.60
```

This logic lives in `calcBills()` (line 557 of `index.html`) and mirrors the `calculate_bill_for_period()` Postgres function in the database schema. The production version will support additional split methods (equal, by floor, by square meter, custom) but the prototype demonstrates the most common case.

---

## Mock Data

The prototype ships with realistic Greek mock data to make the UI feel real during stakeholder demos:

**Buildings:**
- **Λεωφ. Συγγρού 42, Αθήνα** — 6 floors, 10 units (9 occupied), elevator, central heating. 6 expense categories totalling €1,012.70/month.
- **Ερμού 18, Νέα Σμύρνη** — 4 floors, 5 units (4 occupied), no elevator. 3 expense categories totalling €398/month.

**People:** 13 tenants/owners with Greek names, @email.gr addresses, Greek mobile numbers (697x, 698x, etc.), and owner/renter roles.

**Expenses:** Real Greek categories — ΔΕΗ (electricity), ΕΥΔΑΠ (water), cleaning, elevator maintenance, building insurance, management fee.

**Announcements:** 5 posts including water shutoff notice (ΕΥΔΑΠ works), general assembly, elevator maintenance, broken door, and common area rules.

**Maintenance:** 6 requests spanning the full status pipeline — water leak (in progress), burnt lightbulb (submitted), wall crack (acknowledged), elevator noise (resolved), intercom failure (in progress), basement cleaning (submitted).

**Documents:** 9 files — building regulations, insurance policies, general assembly minutes, cleaning contracts, elevator contracts, elevator certificates.

**Financial history:** 6 months of income/expense data (Sep 2025 – Feb 2026) for the bar chart.

---

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `kbg` | `#0c0d12` | Page background |
| `ksurface` | `#14161e` | Sidebar background |
| `kcard` | `#191b25` | Card/panel backgrounds |
| `kborder` | `#252838` | Borders, dividers |
| `ktext` | `#e4e5eb` | Primary text |
| `ksec` | `#868a9e` | Secondary text |
| `kmut` | `#505470` | Muted text, labels |
| `kaccent` | `#4a8df8` | Primary accent (links, active states, focus rings) |
| `kgreen` | `#1faa64` | Success, paid, active, positive trends |
| `kyellow` | `#dba010` | Warning, pending, setup needed |
| `kred` | `#d93548` | Error, overdue, urgent |
| `korange` | `#d96a20` | In-progress, high priority |
| `kpurple` | `#a050f0` | Certificates, special categories |

### Typography

- **UI text**: DM Sans (300–700 weights) — clean, modern, excellent Greek character support
- **Numbers and amounts**: JetBrains Mono — monospaced for aligned columns and financial figures
- **Currency**: formatted with `Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' })`
- **Dates**: formatted with `toLocaleDateString('el-GR')` for Greek month names

### Component Patterns

- **Stat cards**: muted uppercase label, large bold value, secondary context line
- **Status badges**: pill-shaped, color-coded text on 10%-opacity background (`text-kgreen bg-kgreen/10`)
- **Filter chips**: rounded border buttons with active state (blue border + blue tint background)
- **Toggle switches**: animated track + dot with click-to-toggle behavior
- **Progress bars**: animated width transition on a dark track
- **Tables**: muted uppercase headers, hover-highlight rows, consistent padding
- **Cards**: `kcard` background, `kborder` border, hover state changes border to `kaccent`

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Markup | HTML5 | Single-file architecture, semantic elements |
| Styling | Tailwind CSS 3.4 | Installed via npm, compiled at build time |
| Fonts | Google Fonts | DM Sans + JetBrains Mono, preconnected |
| Logic | Vanilla JavaScript | No framework — DOM manipulation + template literals |
| Build | Tailwind CLI | `npx tailwindcss -i src/input.css -o public/style.css --minify` |
| Deploy | Vercel | Zero-config static hosting, auto-builds on push |

No React, no bundler, no node server. The entire app is a single `index.html` file that Tailwind compiles CSS for. This is intentional — the goal of v1 is to validate the UI with stakeholders before investing in framework infrastructure.

---

## Project Structure

```
shared_expenses/
├── package.json              npm scripts + Tailwind dependency
├── tailwind.config.js        Custom theme: colors, fonts
├── vercel.json               Build command + output directory
├── .gitignore                Excludes node_modules, generated CSS, .vercel
│
├── src/
│   └── input.css             Tailwind directives + custom CSS
│                             (animations, scrollbar, nav states, chips, toggles)
│
└── public/
    ├── index.html            The entire application (793 lines)
    │   ├── Lines 1–12        <head> with meta, fonts, stylesheet link
    │   ├── Lines 14–86       Sidebar navigation (logo, 3 nav groups, user avatar)
    │   ├── Lines 88–91       <main> wrapper
    │   ├── Lines 93–208      Dashboard page (stats, buildings table, activity feed)
    │   ├── Lines 210–223     Buildings list + detail containers
    │   ├── Lines 225–250     Tenants + Billing page containers
    │   ├── Lines 252–306     Announcements, Maintenance, Documents containers
    │   ├── Lines 308–355     Reports page (stats, chart containers)
    │   ├── Lines 357–466     Settings page (4 tab panels with forms/toggles)
    │   ├── Lines 474–566     DATA object + helpers (mock data, formatters, calcBills)
    │   ├── Lines 568–593     Navigation + routing logic
    │   ├── Lines 595–664     renderBuildings(), renderBuildingDetail(), switchBdTab()
    │   ├── Lines 666–695     renderTenants(), renderBilling()
    │   ├── Lines 697–758     renderAnnouncements(), renderMaintenance(), renderDocuments()
    │   └── Lines 760–794     renderReports(), switchSettingsTab(), DOMContentLoaded
    │
    └── style.css             Generated at build time by Tailwind CLI (do not edit)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (for Tailwind CSS compilation)
- A modern browser (Chrome, Firefox, Safari, Edge)

### Install and Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-org/koinoxrista.git
cd koinoxrista

# 2. Install Tailwind
npm install

# 3. Build CSS (one-time)
npm run build

# 4. Open in browser
open public/index.html
# or on Linux:
xdg-open public/index.html
```

### Development Mode (watch for changes)

```bash
npm run dev
```

This starts the Tailwind CLI in watch mode. Any time you edit `public/index.html` or `src/input.css`, the CSS is recompiled automatically. Refresh the browser to see changes.

### npm Scripts

| Script | Command | What it does |
|--------|---------|-------------|
| `build` | `npm run build` | Compiles and minifies CSS → `public/style.css` |
| `build:css` | `npm run build:css` | Same as build (alias) |
| `dev` | `npm run dev` | Watches files and rebuilds CSS on change |

---

## Deploying to Vercel

### Option A: GitHub Integration (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click **Import** → select your repo
4. Vercel auto-detects the config from `vercel.json`
5. Click **Deploy**

That's it. Vercel will run `npm install` → `npm run build` → serve the `public/` directory. Every push to `main` triggers a new deployment automatically.

### Option B: Vercel CLI

```bash
npm install -g vercel
cd koinoxrista
vercel
```

Follow the prompts. Your prototype will be live at a `.vercel.app` URL within seconds.

### Option C: Any Static Host

Since the output is just `public/index.html` + `public/style.css`, you can host it anywhere that serves static files — Netlify, Cloudflare Pages, GitHub Pages, or even drag-and-drop into an S3 bucket.

Just make sure to run `npm run build` first so `style.css` is generated.

---

## Database Schema (Preview)

The production database schema has been designed alongside this prototype and lives in `00001_initial_schema.sql`. It's a Supabase (Postgres) migration with Row-Level Security policies for multi-tenant isolation.

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Property management companies (multi-tenant root) |
| `organization_members` | Links users → orgs with roles (owner, admin, member) |
| `buildings` | Physical buildings with address, floors, features |
| `units` | Apartments/shops within a building, each with χιλιοστά share |
| `tenants` | People (owners or renters) with contact details |
| `unit_tenants` | Many-to-many: who lives in which unit, with date ranges |
| `billing_periods` | Monthly billing cycles per building |
| `expense_categories` | Configurable expense types per organization |
| `expenses` | Individual charges (ΔΕΗ, ΕΥΔΑΠ, cleaning, etc.) |
| `expense_unit_overrides` | Per-unit exceptions to the default split method |
| `bills` | Generated bills per unit per period |
| `bill_line_items` | Breakdown of each bill by expense category |
| `payments` | Payment records with method and status tracking |
| `announcements` | Building-wide notifications with priority |
| `maintenance_requests` | Repair tracking with status pipeline |
| `documents` | File metadata (actual files go to object storage) |
| `audit_log` | Immutable record of all data changes |

### Custom Types (Enums)

`expense_split_method` (millesimal, equal, by_floor, by_sqm, custom), `payment_status` (pending, paid, overdue, cancelled, refunded), `payment_method` (card, bank_transfer, iris, cash, other), `unit_type` (apartment, shop, office, storage, parking), `user_role`, `tenant_role`, `expense_status`, `billing_period_status`, `announcement_priority`, `maintenance_status`

### Key Functions

- `calculate_bill_for_period(period_id)` — the Postgres equivalent of the prototype's `calcBills()`. Takes a billing period, fetches all expenses, distributes them across units by millesimal share, and inserts bill + line item records.
- `current_user_organization_id()` — used by RLS policies to scope all queries to the authenticated user's organization.
- `seed_default_categories(org_id)` — populates a new organization with standard Greek expense categories.

An ERD diagram is available in `erd_diagram.mermaid`.

---

## Roadmap: What's Next

### Phase 1 — Foundation (next)

- [ ] Initialize Next.js 15 app with TypeScript
- [ ] Connect Supabase client (auth, database, realtime)
- [ ] Apply the migration schema to a Supabase project
- [ ] Implement Supabase Auth (email/password + magic links)
- [ ] Replace mock data with live database queries
- [ ] Build CRUD forms (create/edit buildings, units, tenants, expenses)

### Phase 2 — The Money

- [ ] Wire up the `calculate_bill_for_period()` function to the UI
- [ ] Integrate Stripe or Viva Wallet for tenant payments
- [ ] Build the tenant-facing payment page ("You owe €47.30 — pay now")
- [ ] Integrate Resend for transactional emails (bill notifications, payment links)

### Phase 3 — The PDF That Sells It

- [ ] Generate the monthly κοινόχρηστα breakdown PDF
- [ ] Match the format Greek tenants recognize (the classic table posted in elevators)
- [ ] Auto-email PDFs to all tenants when a billing period is finalized

### Phase 4 — Polish

- [ ] Tenant self-service portal (payment history, current balance, past statements)
- [ ] Mobile responsive layout (the prototype is desktop-first)
- [ ] PWA support for home screen installation
- [ ] Real-time updates via Supabase Realtime (maintenance status changes, new payments)

### Phase 5 — Secondary Features

- [ ] File upload for documents (Supabase Storage or Cloudflare R2)
- [ ] Team invitation flow with email verification
- [ ] Data validation and error handling on all forms
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Performance optimization (memoization, virtualized long lists)
- [ ] Multi-language support (English as secondary language)

### Deferred (not in MVP)

- Open Banking / PSD2 via GoCardless (complex Greek bank compliance)
- Video assemblies (use Google Meet links instead for now)
- AI assistant / chatbot (a good FAQ page delivers 90% of the value)

---

## License

Proprietary. All rights reserved.
