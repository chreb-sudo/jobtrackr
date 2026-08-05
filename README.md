# JobTrackr

[![CI](https://github.com/chreb-sudo/jobtrackr/actions/workflows/ci.yml/badge.svg)](https://github.com/chreb-sudo/jobtrackr/actions/workflows/ci.yml)

A job-application tracker with a drag-and-drop Kanban board.

- **Frontend** — React 18 + Vite + TypeScript
- **Backend** — Express + TypeScript, Prisma with SQLite
- **Tests** — Vitest + supertest against the real API and a throwaway SQLite database
- **CI** — GitHub Actions runs lint, typecheck, tests and build on every pull request

![The JobTrackr board](docs/screenshots/board.png)

Applications move through five stages: **Applied → Phone → Onsite → Offer → Rejected**. Cards are
dragged between columns and every change is persisted through the API.

## Getting started

Requires Node.js 20+.

```bash
git clone https://github.com/<owner>/jobtrackr.git
cd jobtrackr
npm install

# create the SQLite database and the Prisma client
cp server/.env.example server/.env
npm run prisma:generate --workspace @jobtrackr/server
npm run prisma:push --workspace @jobtrackr/server
```

Run both processes (two terminals):

```bash
npm run dev --workspace @jobtrackr/server   # API on http://localhost:4000
npm run dev --workspace @jobtrackr/web      # UI  on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so open <http://localhost:5173>.

## Scripts

| Command | Description |
| --- | --- |
| `npm run lint` | ESLint across both workspaces |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | API test suite (Vitest) |
| `npm run build` | Compile the server and bundle the web app |

## API

Base URL `http://localhost:4000`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health probe, returns the list of stages |
| `GET` | `/api/jobs` | All jobs, ordered by column position |
| `POST` | `/api/jobs` | Create a job (`company` and `role` required) |
| `PATCH` | `/api/jobs/:id` | Update any field; changing `status` moves the card and appends it to the target column |
| `DELETE` | `/api/jobs/:id` | Delete a job |

Job shape:

```json
{
  "id": "clx…",
  "company": "Acme Corp",
  "role": "Senior Frontend Engineer",
  "link": "https://acme.com/careers/123",
  "notes": "Referred by Dana",
  "status": "Phone",
  "order": 0,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

Invalid payloads return `400` with the Zod issues; unknown ids return `404`.

## Project layout

```
server/   Express API, Prisma schema, Vitest tests
web/      React + Vite single-page app
```
