# Student Contact Directory

Full-stack student contact management system: **React + TypeScript + Vite + Tailwind** frontend, **Node/Express + TypeScript** REST API, **SQLite (better-sqlite3)** database, JWT auth in HTTP-only cookies, Admin/Viewer roles.

## Quick start (local)
Requires Node.js 18+.

```bash
npm run install:all          # installs root, server and client dependencies
cp .env.example .env         # then edit ADMIN_EMAIL / ADMIN_PASSWORD / JWT_SECRET
npm run seed                 # optional: 48 FICTIONAL sample students (also creates the admin account)
npm run dev                  # API on :5000, UI on http://localhost:5173
```

On first start the server creates the database (`./data/students.db`) and the initial **Admin** from `ADMIN_*` env vars (plus an optional read-only **Viewer** if `VIEWER_EMAIL`/`VIEWER_PASSWORD` are set). Existing accounts and data are never overwritten on restart.

The bundled `.env` ships dev-only demo logins: `admin@example.com / Admin@12345` and `viewer@example.com / Viewer@12345`. **Change them before any real use.**

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Production (single server)
```bash
npm run install:all && npm run build
NODE_ENV=production npm start     # Express serves the API and client/dist on PORT
```
In production `JWT_SECRET` must be 32+ random characters (server refuses to start otherwise) and cookies are `Secure`.

### Deploy on Render
`render.yaml` is included (web service + 1 GB persistent disk mounted at `/var/data`, `DATABASE_PATH=/var/data/students.db`). Create a Blueprint from your repo, then set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the dashboard. A persistent disk requires a paid plan; without it SQLite data is lost on redeploy.

## Roles
| Capability | Admin | Viewer |
|---|---|---|
| Dashboard, search, filter, sort, view details | ✓ | ✓ |
| Add / edit / delete students | ✓ | ✗ |
| CSV import / export / template | ✓ | ✗ |

## API (all JSON, cookie auth; `{success, data|message, errors?}`)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` `/logout` | rate-limited login |
| GET | `/api/auth/me` | current user |
| GET | `/api/dashboard/stats` `/recent-students` | DB-driven |
| GET | `/api/students` | `q, department, academicYear, semester, section, status, sortBy(name\|rollNumber\|department\|academicYear\|createdAt), order, page, limit` |
| GET | `/api/students/meta` | distinct filter values |
| GET | `/api/students/:id` | |
| POST / PUT / DELETE | `/api/students[/:id]` | admin; 400 validation, 409 duplicate roll/email |
| POST | `/api/students/import` | admin; body `{csv, commit}` - `commit:false` previews, `true` inserts valid rows |
| GET | `/api/students/export` | admin; honours the same filters as the list |
| GET | `/api/students/template` | admin; CSV template |
| GET | `/api/health` | |

## Structure
`client/` (React app) · `server/src/{config,database,middleware,routes,validators}` · `render.yaml` · `.env.example`

## Notes
- Passwords use **bcryptjs** (pure JS, same algorithm as bcrypt, avoids a second native build).
- Only fictional data is used for samples; do not load real student data without authorization.
