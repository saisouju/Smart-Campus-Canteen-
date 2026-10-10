# Campus Canteen

University canteen ordering and management. Students and faculty order ahead for a pickup slot and watch their order move through the kitchen live. Canteen admins see weekly analytics, run the order queue and manage the menu.

| Layer | Stack |
|---|---|
| Frontend | React 19 · Vite · TypeScript · MUI 9 · Tailwind CSS 4 · Recharts |
| Component workshop | Storybook 10 |
| Backend | Node.js · Express 5 · TypeScript · zod |
| Database | SQLite via `better-sqlite3` |

## Quick start

```bash
npm install
npm run dev          # API on :4000 + web app on :5173
npm run storybook    # component catalogue on :6006
```

Open http://localhost:5173 and sign in with a **@klh.edu.in** Google account. The SQLite file is created at `server/data/canteen.db` and seeded on first boot with a 20-item menu and (optionally) fictional demo customers and two weeks of orders, so the charts and leaderboard have data. `npm run seed` wipes everything except the admin list and reseeds.

## Sign-in (Google OAuth)

1. Copy `server/.env.example` to `server/.env` and fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. `.env` is git-ignored; never commit it.
2. In Google Cloud Console → APIs & Services → Credentials → your OAuth client, add this **Authorized redirect URI**:
   `http://localhost:5173/api/auth/google/callback` (in production, `${PUBLIC_URL}/api/auth/google/callback`).
3. Restart the API. Its startup log prints the exact redirect URI it uses.

How it works:
- The server runs the authorization-code flow with **state and PKCE**, then verifies Google's ID token (signature, audience, expiry).
- It only accepts **verified emails whose domain is exactly `klh.edu.in`**. Look-alikes such as `x@notklh.edu.in` and subdomains are rejected. For Google Workspace accounts, the `hd` claim must match as well.
- **Names come from the email:** `nanna.saisoujanya@klh.edu.in` → "Nanna Saisoujanya". Roll-number-only mailboxes fall back to the Google profile name.
- **Sessions:** a 7-day httpOnly cookie. Only a SHA-256 hash of the token is stored in SQLite.
- **Roles:** everyone signs in as a **student** unless their email is on the admin list.

### Admin access

`nanna.saisoujanya@klh.edu.in` is the **founding admin**: always an admin, and impossible to remove. Under *Admin access* on the dashboard, any admin can add or remove other @klh.edu.in addresses; typing just `firstname.lastname` is enough. The change applies on that person's next request, so nobody has to sign out and back in. Admins can also switch to **Order food** to use the customer view.

### Demo data

The demo customers use `@demo.invalid` addresses, which can never match a real Google account, so nobody can sign in as them. Set `SEED_DEMO_DATA=false` for a clean production database.

## Project layout

```
shared/src/index.ts           Domain types + constants used by both sides (one source of truth)
server/src/
  db/        connection.ts · schema.ts (DDL) · seed.ts
  services/  menu · order · analytics · user · auth (domain check, name-from-email, sessions)
             adminAccess (admin email list) · canteenTemperature (persistent sensor reading)
  routes/    auth (Google OAuth) · menu · orders · admin · schemas.ts (zod request validation)
  middleware/auth.ts (session → user, requireAuth/requireRole) · errorHandler.ts
  utils/     timeSlots.ts (slot generation + id→label mapping) · dates.ts
client/src/
  components/   UI kit: every component has a *.stories.tsx next to it
  components/charts/  Recharts kit (separate entry → code-split with the admin view)
  features/     student/StudentDashboard · admin/AdminDashboard (compose the kit only)
  hooks/        useResource · useCart · useOrderTracking · useAdminOrderQueue (polling)
  api/          typed fetch client for every route
  theme/        MUI theme + AppThemeProvider (shared by the app and Storybook)
  mocks/        fixtures used by stories
```

### One component library, used by both Storybook and the app

Screens never hand-roll UI. They import from `@/components` (and `@/components/charts`), which are the same modules Storybook renders. `AppThemeProvider` wraps both the app (`main.tsx`) and every story (`.storybook/preview.tsx`), so a component looks identical in both places. To build a new screen, look in Storybook first. If something is missing, add it to `components/` together with a story, then compose it.

### Tailwind and MUI together

`src/index.css` declares `@layer theme, base, mui, components, utilities`, and MUI injects into the `mui` layer (`StyledEngineProvider enableCssLayer`). The result:
- Tailwind's preflight never overrides MUI.
- A Tailwind utility in `className` always overrides MUI defaults, with no `!important`.
- Tailwind colors such as `bg-brand` and `text-ink-muted` are aliases of MUI's CSS variables, so a single palette in `theme/theme.ts` drives both systems and both light and dark mode.

## API

| Method | Route | Notes |
|---|---|---|
| GET | `/api/auth/me` | `{ user, googleConfigured }` (user is null when signed out) |
| GET | `/api/auth/google` → `/callback` | Google OAuth; sets the session cookie |
| POST | `/api/auth/logout` | Ends the session |
| GET | `/api/menu` | All items, including unavailable ones (flagged) |
| POST | `/api/menu` | **Admin.** `{ name, category, price, isAvailable }`; duplicate names are rejected with 409 |
| PATCH | `/api/menu/:id` | **Admin.** Partial update, e.g. an availability toggle |
| GET | `/api/orders/time-slots` | Bookable 30-minute slots, 08:00–20:00, 15 orders per slot. Rolls over to tomorrow after closing |
| POST | `/api/orders` | `{ timeSlotId, items[] }`, placed for the signed-in user. Maps the slot id (`2026-10-07@12:00-12:30`) to its label (`12:00 PM - 12:30 PM`). Prices come from the DB inside a transaction, and capacity and sold-out items are enforced |
| GET | `/api/orders/track/:id` | Order snapshot (your own orders only; admins see all) |
| GET | `/api/orders/mine` | Your recent orders |
| POST | `/api/hardware/temperature` | **Hardware key.** `{ celsius, humidity? }` from the ESP32 sensor |
| GET | `/api/hardware/orders` | **Hardware key.** Ready orders for the buzzer, LED and LCD |
| GET | `/api/admin/analytics` | **Admin.** Current-week (Mon–Sun) earnings via `GROUP BY date(created_at)`, gaps filled with zero, plus top items and totals |
| GET | `/api/admin/top-customers?limit=5..10` | **Admin.** All-time leaderboard by items ordered |
| GET/POST/DELETE | `/api/admin/admins` | **Admin.** List, add (`{ email }`) and remove admin emails. The founding admin is protected |
| GET | `/api/admin/orders` | **Admin.** Today's queue |
| PATCH | `/api/admin/orders/:id/status` | **Admin.** `{ status? }`. Omit `status` to advance one step. Orders only move forward |

Order status and temperature updates are polled by the client for serverless compatibility. All order and admin routes require a signed-in session. **Admin** routes also require the admin role, read fresh from the database on every request. See `middleware/auth.ts`.

## Intro sequence

`components/IntroSequence` is a 7.6-second cinematic opener that plays once per browser session:
- Kinetic letter-by-letter typography.
- A single shape that morphs through every scene (blob → square → pill → bowl).
- Iris wipes between scenes.
- One continuous camera move (perspective dolly and pan).

It is pure CSS keyframes with no animation library, and it always comes **before the sign-in page**:
- **Signed-out visitors** see the intro on every page load. The sign-in page only mounts once the intro ends or is skipped (button or Esc), then fades in.
- **Signed-in users** see it once per browser session, so returning from Google doesn't replay it.
- **Signing out** goes straight to the sign-in page.
- **Reduced motion** (the OS setting; on Windows, *Animation effects* off) gets a 2.4-second still title card instead, with opacity changes only.
- The 🎬 button in the header replays it at any time.

## ESP32 hardware

The starter firmware is in `hardware/canteen_esp32.ino`. It uses the provided ESP32 pins for the DHT11 (GPIO 33), buzzer (25) and LED (26), plus an I2C 16x2 LCD on SDA 21 / SCL 22 at address `0x27`. The LCD wiring/address was not included in the original test sketch; adjust these constants to match the actual module. Install the `DHT sensor library`, `ArduinoJson` 6, and `LiquidCrystal_I2C` libraries in Arduino IDE.

Set `HARDWARE_API_KEY` in the hosting environment, then enter that same key, Wi-Fi credentials, the public API URL, and the matching root CA certificate in the sketch's configuration. The ESP32 verifies TLS instead of sending its API key over plain HTTP. Both the browser and device then use the live DHT11 temperature. Simulated readings resume if the device stops reporting for 30 seconds.

The board polls ready orders every 3 seconds. A newly ready order triggers a short buzzer beep; the LED stays on and the LCD shows a ready order while at least one order is ready. When the admin verifies pickup and the order becomes completed, it disappears from the ready queue and the LED turns off on the next poll. If multiple orders are ready, the LED remains on until all are completed. The current workflow does not use RFID, ultrasonic, IR, or relay readings to update an order; pickup is completed by admin QR verification.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API (tsx watch) + Vite dev server with `/api` proxy |
| `npm run storybook` | Storybook on :6006 |
| `npm run build` | Compile shared package, typecheck and production-build the client |
| `npm run typecheck` | Typecheck all three workspaces |
| `npm run seed` | Reset and reseed the SQLite database |

## Vercel deployment

The Vercel function in `api/[...path].ts` exposes the existing `/api/*` routes. In Vercel, import the repository with the project root as the root directory; `vercel.json` builds the unchanged Vite client into `client/dist`. Create a Turso/libSQL database and add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to the Vercel project's environment variables. Without these, the server uses local SQLite for development, which is not persistent on Vercel.

Also configure `PUBLIC_URL` to the deployed Vercel origin, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HARDWARE_API_KEY`, and `SEED_DEMO_DATA=false`. Add `${PUBLIC_URL}/api/auth/google/callback` to the Google OAuth redirect URI list. Deploy again after saving the environment variables. Set the firmware URL to the Vercel URL and paste the CA certificate for that host into `API_ROOT_CA_CERT` before using the ESP32.

Environment variables for local development (`server/.env`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HARDWARE_API_KEY`, `PUBLIC_URL` (default `http://localhost:5173`), `PORT` (default 4000), `DB_PATH`, `SEED_DEMO_DATA`, `CORS_ORIGIN`. Production additionally uses `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
