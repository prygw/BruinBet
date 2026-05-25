# BruinBet

UCLA's prediction market for campus events, sports, academics, and student life.

## Features

- Public market feed backed by SQLite data.
- Market search by name, description, or category.
- UCLA email registration and login.
- JWT-protected backend routes.
- Practice balance for each user.
- Market detail data with options, liquidity, and bet counts.
- Admin-protected market creation.
- Admin market editing for markets created by the current admin.
- Admin market removal with full bet refunds when a listing has no outcome.
- Authenticated bet placement with balance deduction.
- Portfolio and leaderboard views.
- Admin market resolution with pooled payouts.
- Past market section for expired and resolved listings.

## Tech Stack

- React and Vite frontend in `client/`.
- Express backend in `server/` and `routes/`.
- SQLite database initialized from `server/db/schema.sql`.
- JWT authentication with `jsonwebtoken`.
- Password hashing with `bcrypt`.

## Local Setup

Install root dependencies:

```bash
npm install
```

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd client
npm install
```

Create `server/.env`:

```bash
JWT_SECRET=replace_this_with_a_local_secret
PORT=5001
```

You can copy the required keys from `server/.env.example`.

Optional client environment variable:

```bash
VITE_API_BASE_URL=http://localhost:5001
```

If `VITE_API_BASE_URL` is not set, the frontend defaults to `http://localhost:5001`.

## Running Locally

Seed the database:

```bash
cd server
npm run seed
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd client
npm run dev
```

The backend runs on `http://localhost:5001` by default. Vite will print the frontend URL in the terminal, usually `http://localhost:5173`.

## Current API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register with a UCLA email |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/markets?status=open&search=ucla` | List markets with optional status and search filters |
| `GET` | `/api/markets/:id` | Get one market with options and summary stats |
| `POST` | `/api/markets` | Admin-protected market creation |
| `PATCH` | `/api/markets/:id` | Admin-protected edits for markets created by the current admin |
| `DELETE` | `/api/markets/:id` | Admin-protected market removal with bet refunds |
| `POST` | `/api/markets/:id/resolve` | Admin-protected market resolution and payout |
| `POST` | `/api/bets` | Place an authenticated bet |
| `GET` | `/api/portfolio` | Get the authenticated user's positions |
| `GET` | `/api/leaderboard` | Get ranked users by balance and betting activity |

### Auth Notes

Registration requires:

```json
{
  "email": "user@g.ucla.edu",
  "password": "at-least-8-characters",
  "username": "User Name"
}
```

Successful auth responses include a JWT and a safe user object:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@g.ucla.edu",
    "username": "User Name",
    "balance": 10000,
    "is_admin": 0
  }
}
```

Protected routes expect an authorization header:

```http
Authorization: Bearer jwt-token
```

### Market Notes

`GET /api/markets` accepts:

- `status`: defaults to `open`; supported computed values are `open`, `expired`, and `closed`.
- `search`: optional case-insensitive search over market name, description, and category.

Market list responses include summary fields:

- `option_count`
- `total_liquidity`
- `bet_count`

`GET /api/markets/:id` returns the selected market plus its options. Each option includes its own liquidity and bet count.

`POST /api/markets/:id/resolve` accepts a winning option and distributes the market pool proportionally among users who bet on that option:

```json
{
  "winning_option_id": 1
}
```

`DELETE /api/markets/:id` removes an unresolved listing and refunds every bet on that market. Resolved markets cannot be removed this way because winners may already have been paid.

## Architecture Diagrams

### Client-Server Request Flow

```mermaid
flowchart LR
  Browser[React client] -->|fetch /api/auth/*| Auth[Auth routes]
  Browser -->|fetch /api/markets*| Markets[Market routes]
  Browser -->|fetch /api/bets| Bets[Bet route]
  Browser -->|fetch /api/portfolio| Portfolio[Portfolio route]
  Browser -->|fetch /api/leaderboard| Leaderboard[Leaderboard route]
  Auth --> DB[(SQLite)]
  Markets --> DB
  Bets --> DB
  Portfolio --> DB
  Leaderboard --> DB
  Markets -->|admin edit / remove / resolve| Admin[checkAuth + requireAdmin]
  Bets -->|protected action| Protected[checkAuth]
```

The React app calls Express API routes with `fetch`. Protected actions send a JWT in the `Authorization` header; admin-only market creation, edits, removal, and resolution also pass through `requireAdmin`.

### Database Entity Relationship

```mermaid
erDiagram
  users ||--o{ markets : creates
  users ||--o{ bets : places
  markets ||--o{ market_options : has
  markets ||--o{ bets : receives
  market_options ||--o{ bets : selected_by
  market_options ||--o| markets : wins

  users {
    integer id PK
    text email
    text username
    integer balance
    integer is_admin
  }
  markets {
    integer id PK
    text market_name
    text description
    text category
    text status
    text closes_at
    integer winning_option_id FK
    integer created_by FK
  }
  market_options {
    integer id PK
    integer market_id FK
    text label
  }
  bets {
    integer id PK
    integer user_id FK
    integer market_id FK
    integer option_id FK
    integer amount
  }
```

Balances are debited when users place bets. When a market is resolved, winners split the full market pot proportionally to their share of the winning option pool. When an unresolved listing is removed, all bets on that listing are refunded.

## Development Workflow

Useful commands:

```bash
cd server && npm run seed
cd server && npm run dev
cd client && npm run dev
cd client && npm run lint
cd client && npm run build
```

Before opening a pull request, run the client lint/build checks and confirm the server starts with your local `server/.env`.

## Testing

The client currently has linting:

```bash
cd client
npm run lint
```

Automated end-to-end tests are planned with Playwright before the final presentation.

## Project Notes

- The SQLite database file is generated locally and ignored by git.
- New users start with a practice balance of `10000`.
- Registration accepts `@ucla.edu` and `@g.ucla.edu` addresses.
- Optional stretch features are tracked in `updated_scheduled_tasks.md`.
