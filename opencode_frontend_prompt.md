# OpenCode Frontend Task: HireLoop

## Context
You are working in parallel with another agent (building the backend). Your job is to initialize and build the complete **Frontend UI** for HireLoop (a two-sided AI hiring platform). 

## Setup Instructions
1. Initialize a new Next.js 14 project in `./frontend` using the App Router.
   ```bash
   npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*"
   ```
2. Navigate into `frontend` and install `shadcn-ui`.
   ```bash
   cd frontend
   npx shadcn-ui@latest init
   ```
3. Install the Lucide React icons library (if not already added).
   ```bash
   npm install lucide-react
   ```

## UI & Styling Implementation
1. **Design System:** Look at the file `../hireloop-design.html` (one level up from frontend). You MUST port all the CSS variables (`--brand-900` to `--brand-50`, `--accent-main`, etc.) into `frontend/app/globals.css`.
2. **Typography:** Set up `'Syne', sans-serif` for Display/Headings and `'DM Sans', sans-serif` for body text globally as defined in the HTML file. Let Next.js handle Google Fonts via `@next/font/google`.
3. **Components:** Build reusable UI components based on the HTML reference:
   - `Navbar` component (Logo + Tabs).
   - `Button` components (Primary, Ghost, Success, Danger).
   - `StatusBadges` (`score-pill`, `tag`, `confidence-badge`).
   - `Sidebar` (with Icons).

## Pages to Scaffold
Please scaffold the following page routing structures (just the basic layouts/placeholders matched with the sidebar):
- `app/seeker/page.tsx` (Seeker Dashboard Layout)
- `app/recruiter/page.tsx` (Recruiter Dashboard Layout)
- `app/recruiter/pipeline/page.tsx` (Pipeline Funnel view)

Please complete the setup and styling base now, and notify the user when the Next.js frontend is initialized and running on port 3000!
