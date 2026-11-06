# BookBeacon Smart Library Management System

A full-stack library management system with a React frontend, Flask REST API backend, and SQLite database.


## Architecture

```
bookbeacon/
├── client/           # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── services/     # API client and service functions
│   │   ├── context/      # React contexts (Auth, App)
│   │   ├── hooks/        # Custom hooks
│   │   ├── data/         # Mock data (used when VITE_DATA_MODE=mock)
│   │   ├── utils/        # Validation, date, and formatting helpers
│   │   └── styles/       # Global CSS
│   ├── .env              # VITE_DATA_MODE=api | mock
│   └── package.json
│
├── server/           # Flask REST API backend
│   ├── app.py            # Application factory
│   ├── config.py         # Configuration from environment variables
│   ├── extensions.py     # Flask extension singletons
│   ├── models/           # SQLAlchemy data models
│   ├── routes/           # API endpoint blueprints
│   ├── services/         # Business logic layer
│   ├── middleware/       # Auth decorators and error handlers
│   ├── scripts/          # Database seed script
│   ├── tests/            # Pytest test suite
│   ├── instance/         # SQLite database files (auto-created)
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

## Technology Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React 19, React Router, Recharts, Lucide Icons |
| Build          | Vite 8                            |
| Backend        | Python Flask 3.1                  |
| Database       | SQLite via Flask-SQLAlchemy       |
| Auth           | Flask-JWT-Extended (JWT tokens)   |
| Migrations     | Flask-Migrate / Alembic           |
| CORS           | Flask-CORS                        |
| Tests          | pytest + pytest-flask             |

## Quick Start (Windows PowerShell)

### Prerequisites

- **Python 3.10+** installed and on PATH
- **Node.js 18+** and **pnpm** (or npm)

### 1. Clone and Install

```powershell
# Install backend dependencies
cd server
python -m pip install -r requirements.txt

# Install frontend dependencies
cd ..\client
pnpm install   # or: npm install
```

### 2. Configure Environment

```powershell
# Server — copy and edit as needed
copy server\.env.example server\.env

# Client — set to API mode
# The client/.env should contain:
#   VITE_DATA_MODE=api
#   VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Seed the Database

```powershell
cd server
python scripts/seed_db.py
```

This creates `server/instance/bookbeacon.db` with realistic sample data. Safe to run multiple times — never resets existing data.

### 4. Start Both Servers

Open **two terminals**:

```powershell
# Terminal 1 — Flask API (port 5000)
cd server
python app.py

# Terminal 2 — Vite dev server (port 3000)
cd client
pnpm dev   # or: npm run dev
```

### 5. Open the Application

Navigate to **http://localhost:3000** in your browser.

## Deploy the frontend to Vercel

Import this repository into Vercel with the repository root as the project root. The root `vercel.json` builds the Vite frontend into `dist` and sends client-side routes to the app entry point. The frontend defaults to mock mode, so it can be previewed without a backend.

This deploys only the frontend. To use the Flask API in production, deploy the backend separately and set `VITE_DATA_MODE=api` and `VITE_API_BASE_URL` to its public API URL in the Vercel project settings before building.

## Demo Credentials

All seeded accounts use the same password:

| Role      | Email                        | ID          | Password     |
|-----------|------------------------------|-------------|--------------|
| Student   | student@bookbeacon.demo      | S-2024-001  | Beacon2026!  |
| Student   | priya.nair@bookbeacon.demo   | S-2023-018  | Beacon2026!  |
| Student   | mateo.chen@bookbeacon.demo   | S-2024-042  | Beacon2026!  |
| Student   | samira.patel@bookbeacon.demo | S-2022-031  | Beacon2026!  |
| Student   | jordan.lee@bookbeacon.demo   | S-2025-006  | Beacon2026!  |
| Librarian | librarian@bookbeacon.demo    | L-STAFF-001 | Beacon2026!  |

You can log in with either the email or the student/staff ID.

## API Documentation

Base URL: `http://localhost:5000/api`

All responses follow the format: `{ "data": ... }` on success, `{ "message": "..." }` on error.

### Health
| Method | Endpoint       | Auth | Description           |
|--------|----------------|------|-----------------------|
| GET    | `/health`      | No   | Backend availability  |

### Authentication
| Method | Endpoint         | Auth | Description                      |
|--------|------------------|------|----------------------------------|
| POST   | `/auth/register` | No   | Register (creates student only)  |
| POST   | `/auth/login`    | No   | Login with email or ID           |
| POST   | `/auth/logout`   | No   | Logout (client removes token)    |
| GET    | `/auth/me`       | JWT  | Get current authenticated user   |

### Books
| Method | Endpoint         | Auth      | Description                    |
|--------|------------------|-----------|--------------------------------|
| GET    | `/books`         | No        | List/search books (?q=...)     |
| GET    | `/books/:id`     | No        | Get book details with copies   |
| POST   | `/books`         | Librarian | Create a new book              |
| PATCH  | `/books/:id`     | Librarian | Update book metadata           |
| DELETE | `/books/:id`     | Librarian | Archive book (soft delete)     |

### Copies
| Method | Endpoint         | Auth      | Description                    |
|--------|------------------|-----------|--------------------------------|
| GET    | `/copies`        | No        | List copies (?bookId=...)      |
| GET    | `/copies/:id`    | No        | Get copy details               |
| POST   | `/copies`        | Librarian | Register a new physical copy   |
| PATCH  | `/copies/:id`    | Librarian | Update copy location/status    |

### Borrowing
| Method | Endpoint              | Auth      | Description                    |
|--------|-----------------------|-----------|--------------------------------|
| GET    | `/borrowings`         | Librarian | All transactions (?status=overdue) |
| GET    | `/borrowings/my`      | JWT       | Current user's borrowings      |
| POST   | `/borrowings/issue`   | Librarian | Issue a copy to a student      |
| POST   | `/borrowings/return`  | Librarian | Return a copy                  |

### Users
| Method | Endpoint         | Auth      | Description                    |
|--------|------------------|-----------|--------------------------------|
| GET    | `/users`         | Librarian | List all users                 |
| GET    | `/users/:id`     | JWT*      | Get user (* own record only for students) |
| PATCH  | `/users/:id`     | JWT*      | Update user (* own record only for students) |

### Locations
| Method | Endpoint              | Auth | Description                    |
|--------|-----------------------|------|--------------------------------|
| GET    | `/locations/map`      | No   | Full library map with zones    |
| GET    | `/locations`          | No   | List zones                     |
| GET    | `/locations/shelves`  | No   | Flat list of all shelves       |
| GET    | `/locations/:id`      | No   | Get shelf details              |

### QR / Scans
| Method | Endpoint              | Auth | Description                    |
|--------|-----------------------|------|--------------------------------|
| GET    | `/scans`              | Librarian | All scan logs               |
| GET    | `/scans/lookup`       | JWT  | Lookup copy by identifier      |
| POST   | `/scans/verify`       | JWT  | Record a scan + verify location|

### Inventory
| Method | Endpoint                              | Auth      | Description              |
|--------|---------------------------------------|-----------|--------------------------|
| GET    | `/inventory`                          | Librarian | Inventory with scan logs |
| GET    | `/inventory/misplaced`                | Librarian | Misplaced alerts         |
| PATCH  | `/inventory/misplaced/:id`            | Librarian | Update alert status      |
| POST   | `/inventory/misplaced/:id/verify`     | Librarian | Verify alert location    |
| POST   | `/inventory/audit`                    | Librarian | Run inventory audit      |
| GET    | `/inventory/audit`                    | Librarian | Audit history            |

### Notifications
| Method | Endpoint                    | Auth | Description                    |
|--------|-----------------------------|------|--------------------------------|
| GET    | `/notifications`            | JWT  | User's notifications           |
| PATCH  | `/notifications/:id`        | JWT  | Mark as read                   |
| PATCH  | `/notifications/read-all`   | JWT  | Mark all as read               |
| DELETE | `/notifications/:id`        | JWT  | Delete notification            |

### Reports
| Method | Endpoint              | Auth      | Description                    |
|--------|-----------------------|-----------|--------------------------------|
| GET    | `/reports/summary`    | Librarian | Dashboard summary stats        |
| GET    | `/reports/activity`   | Librarian | Recent activity feed           |

## Running Tests

```powershell
cd server
python -m pytest tests/test_api.py -v
```

Tests use a separate SQLite database (`instance/bookbeacon_test.db`) and cover:
- Authentication (register, login, logout, session, inactive users)
- Authorization (student vs librarian role enforcement)
- Book CRUD and validation
- Copy management
- Issue and return workflows with duplicate prevention
- QR scan lookup and location mismatch detection
- Inventory and audit operations
- Notification ownership checks
- User profile access controls
- Report endpoint authorization

## Borrowing Policy

Configurable via environment variables in `server/.env`:

| Variable               | Default | Description                     |
|------------------------|---------|---------------------------------|
| `LOAN_DAYS`            | 14      | Default loan period in days     |
| `FINE_PER_DAY`         | 0.50    | Daily fine for overdue books    |
| `FINE_GRACE_PERIOD_DAYS` | 0     | Grace period before fines start |

## Data Modes

The client supports two modes (set in `client/.env`):

- **`VITE_DATA_MODE=api`** — All data comes from the Flask backend. No fallback to mock data.
- **`VITE_DATA_MODE=mock`** — Frontend uses in-browser mock data (no backend required).

## QR and Future Hardware

The current system supports manual QR scanning through the web interface. The API is designed so that future ESP32 or scanner hardware can supply authenticated location data via `POST /api/scans/verify` with `observedLocationId` — no backend redesign required.

Location mismatches are only reported when trustworthy observed location data is available.
