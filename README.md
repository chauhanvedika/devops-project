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
- Secrets (`.env`) excluded from version control via `.gitignore`; no default credentials anywhere
- Salaries visible to admins only (enforced in the API, covered by tests)
- Backend never exposed publicly: single entry point, NetworkPolicies allow only frontend -> backend -> database
- Kubernetes: non-root, read-only filesystem, dropped capabilities, seccomp, no service-account token, resource limits

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

### Option 1 - Docker Compose (needs Docker)

```bash
cp .env.example .env     # then set DB_PASSWORD, ADMIN_PASSWORD (12+ chars) and JWT_SECRET
docker compose up --build
```

Open http://localhost:3000 and log in as `admin` with the `ADMIN_PASSWORD` you set.
There is no default password: the first admin is created by the `migrate` step only when no users exist.
The backend and database publish no ports; the browser reaches the API through the frontend's `/api` proxy.

### Option 2 - Local Kubernetes (needs Docker, k3d, kubectl)

```bash
./scripts/local-k3d.sh   # builds images, creates a k3d cluster, applies k8s/overlays/local
```

Open http://localhost:8080. Tear down with `k3d cluster delete eims`.

### Tests

```bash
cd backend && npm ci && npm test
```

### Upgrading an existing database

Databases created from the old `init.sql` are adopted automatically by the migration runner.
If the `admin` user still has the old default password, the migrate step prints a warning:
change it with `POST /api/auth/change-password`.

## Project Structure

```
eims/
├── backend/          # Express API (application tier)
├── frontend/         # React SPA (presentation tier)
├── backend/db/       # migration runner, SQL migrations, demo seed (data tier)
├── k8s/              # Kustomize base + overlays (local, aws)
├── scripts/          # local k3d bootstrap, secret creation
├── Jenkinsfile       # CI/CD pipeline
├── docs/             # Architecture notes, diagrams
├── docker-compose.yml
└── .env.example
```

## Roadmap

- [x] Phase 1 - Application build & containerization
- [x] Phase 2 - Version control setup
- [x] Phase 3 - Infrastructure as Code (Terraform: VPC, EC2/k3s, ECR, IAM, OIDC)
- [x] Phase 4 - Hardening, tests, migrations, Kubernetes manifests, Jenkins pipeline
- [ ] Phase 5 - Cost-optimised AWS (no RDS, no NAT; remove unused RDS/private-subnet resources, close NodePort 30050, ECR lifecycle, budget alert, Infracost)
- [ ] Phase 6 - Backups (pg_dump CronJob to S3), remote Terraform state, image signing
- [ ] Phase 7 - Observability (Prometheus, Grafana, alerts)
- [ ] Phase 8 - App features (user management UI, change-password page, audit log, pagination)
