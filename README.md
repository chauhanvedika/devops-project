# EIMS — Employee & Inventory Management System

A 3-tier web application built as a DevOps portfolio project, demonstrating containerization, infrastructure-as-code, CI/CD, and cloud security practices on AWS.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Presentation    │      │   Application     │      │      Data        │
│  React + Nginx   │ ───► │  Node/Express API │ ───► │   PostgreSQL     │
│  (public subnet) │      │  (private subnet) │      │  (private subnet)│
└─────────────────┘      └──────────────────┘      └──────────────────┘
```

- **Presentation tier**: React (Vite) SPA, served by Nginx, running as a non-root container.
- **Application tier**: Node.js/Express REST API with JWT authentication and role-based access control (admin vs employee).
- **Data tier**: PostgreSQL, reachable only from the application tier — never exposed directly.

## Features

- JWT-based login with bcrypt-hashed passwords
- Role-based access: admins can create/edit/delete, all authenticated users can view
- Employee management (CRUD, department assignment)
- Inventory management (CRUD, categories, automatic low-stock flagging)
- Dashboard with headcount-by-department and inventory-value-by-category charts

## Security Measures

- Parameterized SQL queries (no SQL injection)
- Passwords hashed with bcrypt, never stored or logged in plaintext
- JWTs signed with a secret injected via environment variable (never hardcoded)
- Rate limiting (stricter on `/auth/login` to slow brute-force attempts)
- `helmet` middleware for secure HTTP headers
- Input validation on all write endpoints
- Non-root users in all Docker containers
- No database ports exposed to the host — reachable only on an internal Docker network
- Secrets (`.env`) excluded from version control via `.gitignore`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Recharts |
| Backend | Node.js, Express, JWT, bcrypt |
| Database | PostgreSQL |
| Containerization | Docker, Docker Compose |
| Infrastructure (upcoming) | Terraform, AWS (VPC, EC2/k3s, RDS) |
| CI/CD (upcoming) | GitHub Actions |

## Running Locally

Requires Docker Desktop.

```bash
git clone <your-repo-url>
cd eims
cp .env.example .env
```

Edit `.env` and set a real `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then start the stack:
```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/health

Default login: `admin` / `Admin@12345` (change this immediately in any real deployment).

> **Port conflicts?** If 3000 or 5000 are already used on your machine, add
> these two lines to your `.env` (already gitignored) instead of editing
> docker-compose.yml:
> ```
> BACKEND_HOST_PORT=5001
> FRONTEND_HOST_PORT=3001
> ```

## Project Structure

```
eims/
├── backend/          # Express API (application tier)
├── frontend/         # React SPA (presentation tier)
├── db/               # PostgreSQL schema & seed data (data tier)
├── docs/             # Architecture notes, diagrams
├── docker-compose.yml
└── .env.example
```

## Roadmap

- [x] Phase 1 — Application build & containerization
- [x] Phase 2 — Version control setup
- [ ] Phase 3 — Infrastructure as Code (Terraform: VPC, subnets, security groups)
- [ ] Phase 4 — Deployment to AWS (k3s on EC2, RDS)
- [ ] Phase 5 — CI/CD pipeline (GitHub Actions)
- [ ] Phase 6 — Security hardening (Secrets Manager, IAM least-privilege, image scanning)
- [ ] Phase 7 — Monitoring & logging (Prometheus, Grafana)
