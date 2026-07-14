# Planisher

Planisher is a construction planning SaaS for owner-builders, residential builders, contractors, and larger project teams. It brings the programme, progress, task discussions, costs, files, and decisions into one calm workspace built around a Gantt schedule.

The current milestone combines the desktop planning prototype with a mobile-first installable PWA field view and a public marketing site. Supabase provides authentication, onboarding/workspace records, passkey APIs, and a persistent read-only starter-template catalog. Projects created from those templates still use the browser-local prototype store and will be moved to Supabase in the next backend slice.

## What works today

- Supabase email/password sign-up, sign-in, sign-out, password recovery, and protected application routes.
- Mandatory first-login profile and workspace setup.
- Five persistent construction starter plans: single-storey house, double-storey house, multi-storey building, hospital, and school.
- Blank or template-based project creation with shifted dates and reset progress.
- Optional project cover images, nested subtask creation, project dashboard charts, live local time, search, filters, duplicate/delete actions, and workspace templates.
- DHTMLX Gantt schedule with tasks, dependencies, progress, status colors, issue flags, and task focus links.
- Editable task drawer with comments/problems and temporary image, audio, and video previews.
- Installable mobile PWA with a compact dashboard, project list, searchable/filterable task list, hierarchy/dependency cues, field-focused task updates, activity navigation, an account/logout menu, phone-synchronized light/dark appearance, and offline fallback.
- Experimental mobile-PWA passkey controls for Face ID, fingerprint, device PIN, or security-key sign-in after Supabase Passkeys is enabled.
- Public Planisher landing page with rotating residential, school, and high-rise Three.js builds, a scroll-controlled construction story, GSAP reveals, capability carousel, outcome stories, pricing, contact form, and footer. Signed-in visitors receive one Dashboard action instead of sign-in calls to action.
- Project/task budget and expense entry in the local prototype store.
- Browser-based timezone and currency detection.
- Light, dark, and system themes; theme preference is remembered in the browser.
- Pending labels and spinners for server actions, a global route-progress bar, and streamed workspace loading skeletons.

For the detailed product specification and the honest implementation status, see:

- [Product and build plan](docs/PRODUCT_AND_BUILD_PLAN.md)
- [Current state and hosted roadmap](docs/CURRENT_STATE_AND_HOSTED_ROADMAP.md)

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Supabase Auth, PostgreSQL, and Row Level Security
- Drizzle ORM schema definitions and reviewed SQL migrations
- DHTMLX Gantt Community Edition
- date-fns, Zod, Lucide icons, and custom CSS
- pnpm
- Three.js and GSAP for the public marketing experience

## Run locally

### Requirements

- Node.js 20.9 or newer
- pnpm 11 (the repository pins `pnpm@11.7.0`)
- Access to a Supabase project with the Planisher migrations applied

### 1. Clone and install

```bash
git clone https://github.com/mzubairhassan18/planisher.git
cd planisher
pnpm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env.local` and fill in the publishable key from Supabase Project Settings → API Keys.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The publishable key is intended for browser use. Never put a Supabase secret key or service-role key in a `NEXT_PUBLIC_` variable, source control, or a client component.

The repository’s reviewed database changes are in [`drizzle/`](drizzle/). Apply them to a development Supabase project in numeric order. The starter-template catalog is created by `0003_starter_template_catalog.sql` and is readable only by authenticated users through RLS.

### 3. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and complete the first-login setup. The starter templates will appear under **Templates** and in the **New project** dialog.

The public landing page is `/`; the authenticated workspace starts at `/app`. To test install promotion and passkeys, use an HTTPS deployment on a supported mobile browser and install Planisher to the home screen.

### Optional: enable mobile passkeys

Supabase Passkeys is experimental. In Supabase **Authentication → Passkeys**, enable passkeys and set:

- relying-party display name: `Planisher`;
- relying-party ID: the stable production domain, for example `planisher.vercel.app`;
- allowed origin: `https://planisher.vercel.app` (plus loopback local origins only while developing).

Changing the relying-party ID later invalidates previously registered passkeys. Registration is intentionally shown only inside the installed mobile PWA; a confirmed user must sign in with email/password before registering a passkey.

## Useful commands

```bash
pnpm dev          # Start local development on port 3000
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
pnpm build        # Create a production build
pnpm start        # Serve an existing production build
pnpm db:generate  # Generate a Drizzle migration from schema changes
```

Before committing, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Data and persistence

| Data | Current storage | Persists? |
| --- | --- | --- |
| Accounts and sessions | Supabase Auth | Yes |
| Profile, workspace, and subscription seed | Supabase PostgreSQL | Yes |
| Built-in starter templates and template tasks | Supabase PostgreSQL | Yes |
| User-created projects, tasks, comments, costs, and activity | React browser-memory prototype | No; refresh clears them |
| Project covers, selected comment media, and files | Temporary browser object URLs | No |

This distinction is intentional and visible in the UI. Do not use the current build for a real construction project or irreplaceable records. The next major implementation slice replaces the local product store with server-controlled Supabase records and private Storage uploads.

## Starter-template policy

The built-in catalog provides planning scaffolds, not a substitute for a licensed designer, engineer, quantity surveyor, clinical planner, commissioning authority, code official, or contractor. Dates are generic elapsed-day assumptions. Every real project should review local approvals, site conditions, procurement lead times, safety requirements, inspections, commissioning, and handover criteria before adopting a plan.

Built-in templates are migration-managed and read-only to application users. A user can create a project from one and then edit the copied tasks without changing the shared catalog.

## Locale and themes

- Planisher detects the browser’s IANA timezone and derives a likely currency from locale/region data during setup. Users can review those values before saving them.
- Exact construction-site location remains a project field because an account’s browser location is not a reliable substitute for the site address.
- Theme defaults to the operating-system preference. Light, dark, and system choices are available from the desktop account menu and stored only in the browser. The installed PWA deliberately follows the phone theme so an operating-system appearance change is reflected immediately.
- Dark mode uses a low-glare green-charcoal canvas rather than pure black while preserving Planisher’s primary green brand colors.

## PWA behavior

- The manifest starts the installed app at `/app` in standalone portrait mode.
- Android/Chromium receives a dismissible install action only after `beforeinstallprompt` fires; iOS receives “Share → Add to Home Screen” guidance.
- The service worker caches only the public shell/static assets and provides an offline page. Authenticated product records and mutations are not cached, and offline editing is not claimed yet.
- The phone view replaces the Gantt with project/task lists and full-screen field updates. Desktop remains the detailed planning surface.
- The mobile account control exposes identity, dashboard, account/device settings, current phone-theme behavior, and an explicit sign-out action.

## Deployment

The personal development deployment uses Vercel with Git integration. Configure the same two public Supabase environment variables in Vercel for Preview and Production. Pushes to `main` produce the production deployment; feature branches can be used for preview deployments before merging.

Supabase Auth URL Configuration must include the local callback and every deployed callback URL used by the application.

## Security notes

- All exposed application tables have Row Level Security enabled.
- The starter catalog grants authenticated users `SELECT` only; there are no client write policies.
- Authorization must not use editable `user_metadata` claims.
- Never commit `.env.local`, database passwords, secret keys, or service-role keys.
- The local prototype’s UI permission states are not yet a complete server authorization boundary; see the roadmap before extending it to real customer data.

## License

No public open-source license has been granted for Planisher. Third-party packages retain their respective licenses.
