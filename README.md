# 🎓 Campus Student Contact Directory

A full-stack web platform that brings student profiles into one searchable directory, while giving every student **control over who can see their personal contact details**.

Built as a Data Structures and Algorithms (DSA) project at the School of Computer Science and Engineering, Rungta International Skills University, Bhilai.

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PGlite-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Supertest-6E9F18?logo=vitest&logoColor=white)

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Privacy Model](#-privacy-model)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Accounts](#-demo-accounts)
- [Project Structure](#-project-structure)
- [REST API Reference](#-rest-api-reference)
- [Database Design](#-database-design)
- [CSV Import and Export](#-csv-import-and-export)
- [Testing](#-testing)
- [Security](#-security)
- [Complexity Analysis](#-data-structures-and-algorithm-analysis)
- [Known Limitations](#-known-limitations)
- [Future Scope](#-future-scope)
- [Author](#-author)

---

## ❗ The Problem

On most campuses, student contact information lives in paper registers, shared spreadsheets and informal messaging groups. These are:

- **Hard to keep current**: phone numbers change, students switch departments, batches graduate.
- **Slow to search**: manual lookup through long lists.
- **Risky to share**: one widely forwarded file exposes every student's phone number, e-mail and address to everyone who receives it.

## ✅ The Solution

The Campus Student Contact Directory provides:

1. A **single, current source of truth** that students maintain themselves.
2. **Controlled access**: personal details reach only the people the student chooses.
3. **Administrative verification**, so only genuine students appear in the directory, plus bulk management tools for staff.

---

## ✨ Key Features

| Area | What it does |
|---|---|
| **Student Management** | Registration creates a user, a student profile and default privacy settings. Students edit academic details, skills, activities, bio and avatar. |
| **Authentication & Authorization** | JWT-based login, logout, current-user lookup and password change. Role checks on admin routes and ownership checks on profile edits. |
| **Directory Search** | Free-text search plus department, graduation-year, academic-standing and skill filters, with sorting and pagination (max 50 per page). |
| **Privacy Management** | Four visibility levels for contact fields, an `is_searchable` flag, and server-side projection of every returned profile. |
| **Administrative Verification** | Dashboard statistics, verification queue, approve/reject actions, account activation/deactivation. |
| **CSV Import / Export** | Preview with validation and duplicate detection, transactional commit, and CSV export. |
| **Audit Logging** | Security and admin events stored in an `audit_logs` table and viewable by administrators. |

---

## 🛠 Tech Stack

**Frontend**
- React (with Vite), TypeScript
- Tailwind CSS
- React Router

**Backend**
- Node.js, Express.js, TypeScript (modular monolith)
- Zod for request validation
- Multer for file uploads
- JSON Web Tokens (JWT) for authentication

**Database**
- PostgreSQL 16
- **PGlite** (embedded PostgreSQL compiled to WebAssembly) as the zero-configuration default
- **pg.Pool** for hosted PostgreSQL (Supabase, Neon, AWS RDS, etc.) via `DATABASE_URL`

**Testing & Tooling**
- Vitest and Supertest (integration tests)
- TypeScript compiler (`npm run typecheck`)

---

## 🏗 System Architecture

The system is a **modular monolith**: one deployable backend divided into well-separated modules, serving a React single-page application through a RESTful API.

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT TIER   React SPA (Vite, TypeScript, Tailwind)         │
│  Pages · AuthContext · Typed API client · Route guards       │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST / JSON over HTTP
                            │ Authorization: Bearer JWT / HTTP-only cookie
┌───────────────────────────▼──────────────────────────────────┐
│ APPLICATION TIER   Express.js + TypeScript                   │
│  Middleware: request logger · CORS · JWT auth · RBAC · Zod   │
│              · centralized error handler                     │
│  Modules:    Auth · Students · Directory · Admin ·           │
│              Import/Export · Audit                           │
│  Services:   PrivacyService · SearchService · AuditService · │
│              Crypto utilities (hash, ID, JWT)                │
└───────────────────────────┬──────────────────────────────────┘
                            │ Parameterized SQL via Database interface
┌───────────────────────────▼──────────────────────────────────┐
│ DATA TIER   PGlite (default)  |  pg.Pool (via DATABASE_URL)  │
│             File storage: uploads/avatars                    │
└──────────────────────────────────────────────────────────────┘
```

### Dual database configuration

A shared `Database` interface exposes `query`, `transaction`, `migrate` and `close`. Both PGlite and `pg.Pool` implement it, so services contain **no engine-specific code**, and the deployment target changes through configuration alone.

### Request lifecycle for a directory search

1. The browser sends `GET /api/directory` with the chosen filters.
2. The backend validates the filters and builds a **parameterized** SQL query.
3. Matching student records are fetched together with their privacy settings.
4. `PrivacyService` evaluates the requester's identity and role for every sensitive field.
5. Unauthorized fields are replaced with `null` **before serialization**.
6. The authorized result is returned as JSON.

---

## 🔒 Privacy Model

Privacy is the central feature of the system. Each student chooses a visibility level for **phone number, personal e-mail, addresses and social links**.

| Level | Who may see the field |
|---|---|
| `PUBLIC` | Any visitor, including unauthenticated guests |
| `CAMPUS` | Authenticated campus users (students, faculty, administrators) |
| `ADMIN_ONLY` | Authorized administrators and the profile owner; hidden from other students |
| `PRIVATE` | The profile owner and authorized system super-administrators |

### Server-side Privacy Projection Engine

Implemented in `PrivacyService.projectStudent`. For each student record it takes the requester's identity and the student's privacy settings, decides which sensitive fields the requester may see, and replaces everything else with `null` **before the object is serialized**.

> **Why server-side?** If the server sent a complete record and the browser merely hid restricted fields, the values would still be visible in the network response, in developer tools, and to any script calling the API directly. Projection before serialization guarantees a restricted value never leaves the server. The same function is used by the directory and the profile endpoint, so rules are applied consistently.

### Example

A student sets phone → `CAMPUS`, personal e-mail → `ADMIN_ONLY`, social links → `PUBLIC`, permanent address → `PRIVATE`:

| Field (setting) | Guest | Student | Admin | Owner |
|---|:---:|:---:|:---:|:---:|
| Social links (`PUBLIC`) | ✅ | ✅ | ✅ | ✅ |
| Phone (`CAMPUS`) | `null` | ✅ | ✅ | ✅ |
| Personal e-mail (`ADMIN_ONLY`) | `null` | `null` | ✅ | ✅ |
| Permanent address (`PRIVATE`) | `null` | `null` | `null`* | ✅ |

\* See [Known Limitations](#-known-limitations): the profile projection currently grants ordinary administrators broader access to `PRIVATE` fields than the intended rule.

### Directory visibility rules

- Non-administrators see only **VERIFIED** profiles (a student can always see their own).
- Guests additionally see only profiles whose `is_searchable` flag is `true`.
- New registrations stay **PENDING** until an administrator verifies them.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.x or higher
- **npm** v10.x or higher
- 4 GB RAM or more recommended
- Internet connection only if you use a hosted PostgreSQL service

### 1. Clone the repository

```bash
git clone https://github.com/yashrajsingh-CSE/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and edit it (see [Environment Variables](#-environment-variables)):

```bash
cp .env.example .env
```

### 4. Seed the database (optional, for local demo)

```bash
npm run seed
```

This applies the migration and inserts an idempotent set of demonstration accounts.

### 5. Start the development servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API (Express) | http://localhost:5000 |

The Vite configuration proxies `/api` and `/uploads` to the backend, so the frontend talks to the API without extra setup.

### Other useful scripts

```bash
npm run build       # build for production
npm run test        # run the server integration test suite
npm run typecheck   # run the TypeScript compiler on both projects
```

> **Note:** Check the root `package.json` for the exact script names in your copy of the repository.

---

## ⚙️ Environment Variables

Variables are validated with **Zod** at start-up.

| Variable | Purpose |
|---|---|
| `PORT` | Express API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Secret used to sign JWTs. **Must be strong and unique in production.** |
| `JWT_EXPIRES_IN` | Token lifetime (7 days in the sample configuration) |
| `CORS_ORIGIN` | Allowed frontend origin(s) |
| `DATA_DIR` | Folder where PGlite stores its files (embedded mode) |
| `DATABASE_URL` | *(optional)* PostgreSQL connection string. When set, the app uses `pg.Pool` instead of PGlite. |

> 🔐 Never commit real secrets. Keep `.env` out of version control.

---

## 👤 Demo Accounts

`npm run seed` creates one administrator and three students (one of them `PENDING`), so you can try every role locally.

> ⚠️ The seed credentials are for **local demonstration only**. Never reuse them for real accounts or deployments. See the seed script for the exact values.

---

## 📁 Project Structure

```
.
├── src/                        # React frontend
│   ├── api/                    # Typed API client
│   ├── context/                # AuthContext
│   └── pages/                  # Directory, Profile, Edit Profile,
│                               # Login, Register, Admin, Import/Export
├── server/
│   ├── src/
│   │   ├── app.ts              # Express app, middleware, module mounting
│   │   ├── db/
│   │   │   └── migrations/     # SQL migrations (001_initial_schema.sql)
│   │   └── modules/            # auth, students, directory, admin,
│   │                           # import-export, audit
│   │                           # (routes · controllers · services · Zod schemas)
│   └── uploads/avatars/        # Uploaded profile photographs
└── package.json                # Scripts for dev, build, test, typecheck, seed
```

> The tree above is a simplified overview. Adjust folder names to match your repository.

---

## 📡 REST API Reference

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create account, profile and default privacy settings | Public |
| `POST` | `/api/auth/login` | Authenticate; return JWT and session | Public |
| `POST` | `/api/auth/logout` | Clear the auth cookie | Public |
| `GET` | `/api/auth/me` | Current user and linked student record | Authenticated |
| `POST` | `/api/auth/change-password` | Change password | Authenticated |
| `GET` | `/api/directory` | Multi-criteria search with privacy projection | Optional (guests allowed) |
| `GET` | `/api/directory/filters` | Distinct departments, years, standings | Public / optional |
| `GET` | `/api/students/:id` | Profile view, projected by requester | Optional (guests allowed) |
| `PATCH` | `/api/students/:id` | Update profile | Owner or admin |
| `PATCH` | `/api/students/:id/privacy` | Update visibility settings | Owner or admin |
| `POST` | `/api/students/:id/avatar` | Upload profile photo (5 MB limit) | Authenticated |
| `GET` | `/api/admin/stats` | Dashboard statistics | ADMIN / SUPERADMIN |
| `PATCH` | `/api/admin/students/:id/verify` | Approve or reject a student | ADMIN / SUPERADMIN |
| `PATCH` | `/api/admin/users/:id/status` | Activate or deactivate a login | ADMIN / SUPERADMIN |
| `GET` | `/api/admin/audit-logs` | Paginated audit events | ADMIN / SUPERADMIN |
| `POST` | `/api/import-export/preview` | Parse and validate CSV; detect duplicates | ADMIN / SUPERADMIN |
| `POST` | `/api/import-export/commit` | Insert validated batch in a transaction | ADMIN / SUPERADMIN |
| `GET` | `/api/import-export/export` | Export directory as CSV | ADMIN / SUPERADMIN |

Errors are returned as structured JSON with appropriate status codes (`400`, `401`, `403`, `404`, `409`).

### Directory search example

```http
GET /api/directory?q=computer&department=Computer%20Science&graduationYear=2026&sortBy=name&page=1&limit=10
Authorization: Bearer <JWT>   (optional: guests may call without a token)
```

Query parameters: `q`, `department`, `graduationYear`, `academicStanding`, `skill`, `sortBy`, `page`, `limit` (max 50). Administrators may also filter by verification status.

```json
{
  "data": [
    {
      "id": "stu_001",
      "firstName": "Ananya",
      "lastName": "Verma",
      "department": "Computer Science",
      "graduationYear": 2027,
      "academicStanding": "Junior",
      "skills": ["Python", "React"],
      "phone": null,
      "personalEmail": null
    }
  ],
  "pagination": { "page": 1, "limit": 2, "total": 14 }
}
```

*(All sample records are fictional and the JSON is simplified.)*

---

## 🗄 Database Design

The initial migration `001_initial_schema.sql` defines four tables. Skills and activities are stored as **JSONB** columns inside `students`.

| Table | Keys and constraints | Purpose |
|---|---|---|
| `users` | Primary key; unique e-mail | Login identity: e-mail, password hash, role, `is_active`, `is_verified`, timestamps |
| `students` | Primary key; unique FK to `users`; unique enrollment number | Academic details, contact details, bio, skills and activities (JSONB), avatar, verification status |
| `student_privacy_settings` | Primary key; unique FK to `students` | Visibility level of phone, personal e-mail, addresses and social links; `is_searchable` flag |
| `audit_logs` | Primary key; actor reference | Actor, action, affected entity, details, IP address, timestamp |

**Relationships:** a user has at most one student profile, and a student has exactly one privacy-settings row (both one-to-one, enforced by unique constraints). A user may be the actor of many audit events. The migration also creates indexes on frequently searched or filtered columns and on audit-log lookups. The migration runner applies SQL files in sorted order and records the applied versions.

---

## 📥 CSV Import and Export

Bulk loading is a **two-step** process:

1. **Preview**: the administrator uploads a CSV (up to 10 MB). The server parses it, maps common header variants, validates each row with Zod, and checks for duplicate e-mails and enrollment numbers both within the file and against the database. It returns up to 20 sample rows plus error and duplicate information.
2. **Commit**: after confirmation, the server inserts users, student profiles and privacy settings inside a **single database transaction**. If any insert fails, everything rolls back and no partial import remains.

`GET /api/import-export/export` returns the directory as a CSV file.

### Sample file

```csv
email,enrollment_number,first_name,last_name,department,graduation_year
kabir.nair@campus.example,CS26001,Kabir,Nair,Computer Science,2028
isha.rao@campus.example,CS26002,Isha,Rao,Electronics,2028
kabir.nair@campus.example,CS26003,Kabir,Nair,Computer Science,2028
dev.malik@campus.example,CS26004,Dev,Malik,Mechanical,20X8
```

Preview result: **2 valid** rows (1 and 2), **1 duplicate** (row 3 repeats row 1's e-mail), **1 invalid** (row 4 has a malformed graduation year). Only the two valid records can be committed.

---

## 🧪 Testing

Tests use **Vitest** as the runner and **Supertest** to send HTTP requests to the Express app, so each test exercises the real routes, middleware and database layer.

Covered areas:

- Health check and structured 404 responses
- Authentication: admin and student login, invalid password, current-user lookup, registration, duplicate e-mail rejection
- Authorization and profiles: owner access to private fields, rejection of edits by other students
- Privacy field stripping and directory filtering, privacy-preference updates
- Administration: dashboard stats, admin-route restriction, student verification
- CSV ingestion: preview, duplicate and invalid-row handling, commit, export, audit actions

```bash
npm run test        # run the server suite
npm run typecheck   # type-check both projects
```

---

## 🛡 Security

| Mechanism | How it works | Status |
|---|---|---|
| JWT authentication | Signed token with configurable expiry; Authorization header plus HTTP-only cookie | ✅ Implemented |
| Password protection | Passwords hashed before storage; hashes never returned | ✅ Implemented |
| Role-Based Access Control | Middleware restricts `/api/admin` and `/api/import-export` to ADMIN and SUPERADMIN | ✅ Implemented |
| Ownership verification | Students may change only their own profile and privacy; violations return 403 and are audited | ✅ Implemented |
| Server-side privacy projection | `PrivacyService` nulls unauthorized fields before serialization | ✅ Implemented |
| Request validation | Zod schemas on several input paths; SQL uses bound parameters | 🟡 Partly |
| Active-account check | Middleware rejects deactivated users on every request | ✅ Implemented |
| Security audit logging | Important events written to `audit_logs` | ✅ Implemented (not immutable) |
| Centralized error handling | Structured JSON errors | ✅ Implemented |
| CORS | Origin list based on localhost and `CORS_ORIGIN` | 🟠 Needs tightening |
| Rate limiting, CSRF protection, encryption at rest | Not implemented | ❌ Not claimed |

Defense is layered: guests cannot reach admin routes (RBAC), students cannot edit others' profiles (ownership), restricted fields are never sent to unauthorized requesters (projection), and every sensitive action leaves a trace (audit log).

---

## 📊 Data Structures and Algorithm Analysis

Most searching, sorting and filtering is delegated to PostgreSQL rather than implemented with in-memory structures such as a Trie or HashMap. Let *n* = student records, *m* = search criteria, *k* = matches, *p* = page size (≤ 50), *N* = CSV rows.

| Operation | Method | Time | Space |
|---|---|---|---|
| Multi-criteria search | SQL `WHERE` with bound parameters; B-tree indexes | ~O(log n + k) indexed; O(n·m) unindexed/substring | O(k) |
| Sorting | SQL `ORDER BY` | O(k log k) | O(k) |
| Pagination | `page` and `limit` (capped at 50) | Returns p ≤ 50 rows | O(p) |
| Privacy projection | Per-record check of a fixed number of field groups | O(p) | O(p) |
| Skill filter | JSONB `skills` column | O(n) unless a GIN index is added | O(k) |
| CSV parse and validation | Whole file buffered; Zod per row | O(N) | O(N) |
| Duplicate detection | Within file and against database | O(N) expected with a hash set or batched indexed lookups | O(N) |
| Batch commit | Single transaction, three inserts per record | O(N) | O(N) |
| Password check / JWT verify | Hash comparison; signature check | Constant per request | O(1) |

The dominant application-level cost per request is O(p), bounded by the page-size cap.

---

## ⚠️ Known Limitations

Identified during source review and planned for hardening before any real deployment:

| Item | Planned improvement |
|---|---|
| CORS fallback accepts any origin | Reject origins not on an explicit allow-list |
| CSV commit trusts client-supplied records | Re-validate every record and re-check duplicates at commit time |
| Imported users share one temporary password | Per-user invitation or forced password reset |
| Development JWT secret accepted as fallback | Require a strong, separately generated secret in production |
| Avatar checks trust extension and MIME type | Verify file signatures and re-encode images |
| `/api/auth/me` returns the owner's contact fields directly | Keep explicitly owner-only and document the policy |
| `is_searchable` applies to guests only; pending users can log in | Define the intended policy and apply it consistently |
| Profile projection grants admins access to `PRIVATE` fields | Align with the documented rule (owner and super-admins only) |
| Audit log not enforced as immutable; CSV not streamed | Add database protections; stream CSV ingestion |

---

## 🔮 Future Scope

Proposed extensions (**not** part of the current version):

- Advanced search: fuzzy matching and ranked results
- Intelligent student recommendations based on shared skills or departments
- Usage and registration analytics
- Mobile application
- Notification system for verification results and profile changes
- Improved administrative reporting and data visualization
- More configurable privacy controls (per-viewer or per-group rules)
- Integration with institutional systems such as the ERP
- Scalability work: caching, streaming CSV ingestion, database tuning

---

## 📚 Documentation

A detailed project interim report (architecture, diagrams, UML, ER design, algorithm analysis) is available in the repository's `docs/` folder.

---

## 👨‍💻 Author

**Yash Raj Singh**
B.Tech in Computer Science & Engineering (AI & ML, in association with IBM)
School of Computer Science and Engineering, Rungta International Skills University, Bhilai, Chhattisgarh

Guided by **Surya Mani Verma**, Technical Trainer

- 🌐 Portfolio: [yashrajsingh-cse.github.io](https://yashrajsingh-cse.github.io/)
- 💼 LinkedIn: [yash-raj-singh-harsh](https://www.linkedin.com/in/yash-raj-singh-harsh)
- 🐙 GitHub: [@yashrajsingh-CSE](https://github.com/yashrajsingh-CSE)

---

## 📄 License

Add a license of your choice (for example MIT) and reference it here.

---

⭐ If you found this project useful, consider giving the repository a star!
