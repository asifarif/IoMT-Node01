# IoMT Telemedicine Dashboard (web)

Live patient-vitals dashboard. Reads the `vitals` table from Supabase and
updates in real time. Built with React + Vite, deploys free on Vercel.

## Run locally
1. `cd web`
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key.
4. `npm run dev` and open the printed localhost URL.

## Deploy on Vercel
1. Push this repo to GitHub.
2. In Vercel: New Project -> import the repo -> set **Root Directory = web**.
3. Add two Environment Variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Every push to `main` redeploys; every pull request gets a preview URL.

## For student groups
Each group owns one component under `src/components/`:
- PatientCard  — the per-patient tile (done, extend it)
- VitalsChart  — the live chart (done, extend it)
- (add) HistoryView, AlertsPanel, MonitorWall, Auth/PatientProfile

Work on a feature branch, open a pull request, demo your Vercel preview URL,
get it reviewed, then merge.
