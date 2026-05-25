# BruinBet Updated Scheduled Tasks

Updated after Hao Gu dropped the class.

Current planning date: Thursday, May 14, 2026 (Week 7).
Presentation deadline: Friday, June 5, 2026 (Week 10).

Status update: Monday, May 25, 2026 (Week 9).

## ASAP / Behind Schedule

These are the highest-priority items based on the current repo state and the original timeline:

- ~~Admin market resolution and payout logic is not implemented.~~ `POST /api/markets/:id/resolve` now validates admin access, validates the winning option, closes the market, sets `winning_option_id`, and pays winners in a transaction.
- ~~Frontend resolution UI is not implemented.~~ Admins can now manage their markets and assign a winning result from the app.
- ~~Frontend market search still filters local state instead of querying the server.~~ `MarketPreviewGrid` now queries `GET /api/markets?status=open&search=...`.
- ~~Market cards still need visible option stats before a bet is placed.~~ Market cards now always show live distribution, pool size, and bet count.
- ~~README is stale and missing architecture diagrams.~~ README now documents current setup, API behavior, admin edit/remove/resolve flows, and includes request-flow plus database diagrams.
- **ASAP: Client lint is currently failing.** Known blockers include a conditional hook call in `AdminCreateMarketPage.jsx`, unused variables/imports, and a synchronous state update warning in `App.jsx`.
- **BEHIND: Playwright E2E tests are not present.** Phase 4 starts Thursday, May 28, so setup should begin immediately after resolution is working.

## Planning Goals

This plan keeps the original cluster order because the dependencies are still correct: authentication comes before protected betting, markets come before place-bet flows, and betting data comes before portfolio, leaderboard, and resolution. The assignment model changes from equal frontend/backend rotations to file and feature ownership so the four remaining teammates avoid overlapping edits and merge conflicts.

Primary goals:

- Finish the core prediction-market app by Friday of Week 10.
- Keep team members out of each other's files whenever possible.
- Add rubric-specific work that was missing from the original schedule.
- Treat profiles and threaded comments as optional stretch work.

## Current Repo Status

### Implemented

- Express API server in `server/index.js`.
- API routing through `routes/index.js`.
- Auth routes in `routes/auth.js` for registration and login.
- JWT helper and auth middleware in `middleware/auth.js`.
- SQLite database setup in `server/db/index.js`.
- Database schema for `users`, `markets`, `market_options`, and `bets` in `server/db/schema.sql`.
- Seed script with sample markets in `server/db/seed.js`.
- Public React landing page, market preview grid, search input, auth flow, dashboard, and logout in `client/src/App.jsx`.
- Registration/login form in `client/src/Registration.jsx`.
- Basic visual styling in `client/src/App.css` and `client/src/index.css`.
- `POST /api/bets` exists with auth, option validation, one-bet-per-market validation, balance validation, balance deduction, and bet insertion.
- `POST /api/markets` exists with admin auth, validation, market creation, and option creation.
- Portfolio backend and frontend pages exist.
- Leaderboard backend and frontend pages exist.
- Admin create-market frontend exists and is wired to the backend.
- Admin market resolution backend exists with payout calculation.
- Admin manage-markets frontend exists with edit, result assignment, and remove-listing controls.
- `PATCH /api/markets/:id` exists for admin edits to markets created by the current admin.
- `DELETE /api/markets/:id` exists for removing unresolved listings and refunding all bets.
- README includes setup, current API behavior, and two architecture diagrams.

### Needs Fixing Before More Feature Work

- ~~`middleware/requireAdmin.js` does not call `next()`, so admin routes will hang.~~
- ~~`routes/auth.js` sets new user balance to `1000`, while the schema and original plan expect `10000`.~~
- ~~Server-side UCLA email validation is not enforced in `routes/auth.js`.~~
- ~~Registration does not validate required `email`, `password`, or `username` before hashing/inserting.~~
- ~~`GET /api/markets/:id` is still a stub.~~
- ~~`POST /api/markets` is still a stub.~~
- ~~Market cards do not yet show prices, liquidity, or option stats before a user has placed a bet.~~
- ~~`GET /api/markets?search=...` server-side search endpoint should be implemented.~~
- ~~Frontend search still needs to call `GET /api/markets?status=open&search=...` instead of filtering already-loaded data.~~
- ~~There is no place-bet API.~~
- ~~There is no wager UI.~~
- There is no dedicated bet detail or market detail page.
- ~~There is no portfolio API or portfolio UI.~~
- ~~There is no leaderboard API or leaderboard UI.~~
- ~~There is no admin market resolution endpoint or payout calculation.~~
- ~~There is no frontend UI for admins to resolve a market.~~
- There are no automated end-to-end tests.
- ~~The root `README.md` is too sparse for the rubric.~~
- ~~The root `README.md` is now stale and still needs architecture diagrams.~~
- ~~There are no architecture diagrams in the README.~~

## Rubric Coverage Check

| Rubric Requirement | Current Status | Required Plan Addition |
|---|---|---|
| Display dynamic data | Mostly met by seeded market feed, portfolio, leaderboard, and live market distributions | Keep polishing resolved-market states |
| Upload data from client to backend | ~~Met by registration/login, admin market creation, and bet placement~~ | Keep validation tight |
| Security/authentication | Mostly met by JWT auth and admin/protected routes | **ASAP:** fix lint-blocking conditional hook and continue admin edge-case checks |
| Meaningful search through server data | ~~Met by backend search and frontend query integration~~ | Keep search behavior covered in E2E tests |
| Three more distinct features | ~~Met by market creation, betting, portfolio, leaderboard, and resolution UI/backend~~ | Keep polishing demo flow |
| Git understanding | Process-dependent | Use small branches, PRs, and file ownership |
| Detailed README | ~~Met with setup instructions, current API docs, and two architecture diagrams~~ | Keep docs current as behavior changes |
| Visually pleasing/easy navigation | Partially met | Polish core flows and resolved-market states |
| Readable code | Partially met | **ASAP:** fix lint blockers and conditional hook issue |
| 2+ E2E tests | Not met | Add Playwright with at least auth/market and betting flows |
| 2+ architecture diagrams in README | ~~Met with request-flow and database/entity diagrams~~ | Keep diagrams consistent with future changes |

Conclusion: the original `scheduled_tasks.md` is not sufficient for full marks because it omits E2E tests, README work, diagrams, server-side search, Git workflow expectations, and security hardening tasks. This updated plan adds those explicitly.

## Merge Conflict Avoidance Rules

1. Each person owns specific files or modules for each phase.
2. Nobody edits another person's owned file without asking first.
3. Schema changes go through one schema owner at a time.
4. `client/src/App.jsx` should be split early so frontend work can happen in separate page/component files.
5. Backend routes should be split by feature: `auth`, `markets`, `bets`, `portfolio`, `leaderboard`, and optionally `resolution`.
6. Pull from `main` before starting work and before opening a PR.
7. Keep PRs small enough to review in one sitting.
8. Merge backend contract stubs early so frontend work can use stable API shapes.

## Proposed File Ownership

These owners can change if the team prefers, but the important rule is that each row should have exactly one primary owner at a time.

| Area | Primary Owner | Main Files |
|---|---|---|
| Auth backend and security fixes | Priyam Rangwala | `routes/auth.js`, `middleware/auth.js`, `middleware/requireAdmin.js` |
| Markets backend | Harry Yu | `routes/markets.js`, market helper functions |
| Betting backend | Harry Yu | new `routes/bets.js`, `routes/index.js`, bet-related DB queries |
| Schema and seed coordination | Alex Markova | `server/db/schema.sql`, `server/db/seed.js` |
| Frontend app split/navigation | Alex Markova | `client/src/App.jsx`, new page/component folders |
| Frontend market feed/detail/betting UI | Alex Lin | new market and betting page/component files |
| Portfolio and leaderboard backend | Priyam Rangwala | new `routes/portfolio.js`, new `routes/leaderboard.js` |
| Portfolio and leaderboard frontend | Alex Lin | new portfolio and leaderboard page/component files |
| README, diagrams, and demo script | Alex Markova + Harry Yu | `README.md`, diagram sections |
| Playwright E2E tests | Priyam Rangwala + Alex Lin | new Playwright config and test files |

## Recommended Frontend Split

Do this before heavy frontend feature work:

```text
client/src/App.jsx
client/src/components/Header.jsx
client/src/components/MarketCard.jsx
client/src/pages/Landing.jsx
client/src/pages/AuthPage.jsx
client/src/pages/Dashboard.jsx
client/src/pages/MarketDetail.jsx
client/src/pages/Portfolio.jsx
client/src/pages/Leaderboard.jsx
```

This prevents every frontend task from touching `App.jsx`.

## Recommended Backend Split

Keep route files focused:

```text
routes/auth.js
routes/markets.js
routes/bets.js
routes/portfolio.js
routes/leaderboard.js
routes/resolution.js
```

If time is tight, `resolution.js` can be folded into `markets.js`, but only one backend owner should edit that route during the resolution phase.

## API Contract Targets

Agree on these contracts before frontend and backend split work:

```http
GET /api/markets?status=open&search=ucla
GET /api/markets/:id
POST /api/markets
PATCH /api/markets/:id
DELETE /api/markets/:id
POST /api/bets
GET /api/portfolio
GET /api/leaderboard
POST /api/markets/:id/resolve
```

Minimum expected behavior:

- ~~`GET /api/markets` returns market cards with status, close time, total liquidity, and option summaries.~~ Frontend now displays live distribution, pool size, and bet count before betting.
- ~~`GET /api/markets/:id` returns one market, options, liquidity, and bet count.~~ Current user's position is not included in this response.
- ~~`POST /api/markets` requires admin auth and creates a market with options.~~
- ~~`PATCH /api/markets/:id` requires admin auth and edits markets created by the current admin.~~
- ~~`DELETE /api/markets/:id` requires admin auth, removes unresolved listings, and refunds all bets.~~
- ~~`POST /api/bets` requires auth, validates balance, deducts balance, and inserts a bet.~~
- ~~`GET /api/portfolio` requires auth and returns the user's positions.~~ Resolved positions display won/lost from `winning_option_id`.
- ~~`GET /api/leaderboard` returns users ranked by balance or total value.~~
- ~~`POST /api/markets/:id/resolve` requires admin auth and pays winners.~~

## Updated Timeline

## Phase 0 — Week 7 Thursday-Friday, May 14-15: Stabilize Current Base

Goal: fix blockers before building more features.

| Owner | Tasks | Main Files |
|---|---|---|
| Priyam Rangwala | ~~Fix admin middleware, enforce server-side UCLA email validation, validate auth request bodies, align initial balance to `10000`~~ | `routes/auth.js`, `middleware/requireAdmin.js` |
| Harry Yu | ~~Finish market list response shape, add server-side `search` query support, document market status rules~~ | `routes/markets.js` |
| Alex Markova | ~~Coordinate schema/seed review, confirm seed users and markets support demos and tests~~ | `server/db/schema.sql`, `server/db/seed.js` |
| Alex Lin | ~~Review current frontend market feed and list data fields needed from backend~~ | frontend market components after split |

Deliverable by Friday of Week 7:

- ~~Registration/login work reliably.~~
- ~~Open markets load from the backend.~~
- ~~Server-side market search exists.~~
- ~~Admin middleware no longer hangs.~~
- ~~Everyone agrees on API response shapes.~~

## Phase 1 — Week 8 Monday-Wednesday, May 18-20: Markets and Bet Placement

Goal: satisfy the core app loop: browse market, inspect market, place bet.

| Owner | Tasks | Main Files |
|---|---|---|
| Harry Yu | ~~Implement `GET /api/markets/:id`, `POST /api/bets`, balance validation, option validation, balance deduction~~ | `routes/markets.js`, `routes/bets.js`, `routes/index.js` |
| Alex Lin | ~~Build option selector, wager input, and post-bet success/error UI~~; **still needs dedicated market detail page if the team wants this exact planned UI** | betting components |
| Alex Markova | ~~Split `App.jsx` into pages/components and keep navigation stable~~ | `client/src/App.jsx`, `client/src/components/*`, `client/src/pages/*` |
| Priyam Rangwala | ~~Add backend error handling consistency and auth checks for protected bet routes~~ | `middleware/auth.js`, `routes/bets.js` in coordination with Harry |

Deliverable by Wednesday of Week 8:

- ~~User can browse server data.~~
- ~~User can search server data from the frontend.~~
- ~~User can authenticate.~~
- ~~Authenticated user can place a bet.~~
- ~~User balance changes after placing a bet.~~

## Phase 2 — Week 8 Thursday-Friday, May 21-22: Admin Market Creation and README Skeleton

Goal: complete client-to-backend data upload beyond auth and start documentation early.

| Owner | Tasks | Main Files |
|---|---|---|
| Harry Yu | ~~Implement `POST /api/markets` with option creation and admin requirement~~ | `routes/markets.js` |
| Alex Lin | ~~Build admin create-market form and wire it to backend~~ | admin page/component files |
| Priyam Rangwala | ~~Add admin auth behavior using `is_admin`, confirm non-admin users are rejected~~ | `middleware/requireAdmin.js`, `routes/auth.js` |
| Alex Markova | ~~Expand README skeleton with setup steps, env vars, scripts, feature list, API overview, stale content cleanup, and diagrams~~ | `README.md` |

Deliverable by Friday of Week 8:

- ~~Admin can create a market from the frontend.~~
- ~~Normal users cannot create markets.~~
- ~~README has accurate local setup instructions.~~
- ~~README updated to stop calling completed routes stubs and to include diagrams.~~

## Phase 3 — Week 9 Monday-Wednesday, May 25-27: Portfolio, Leaderboard, and Resolution

Goal: finish the three-feature requirement with useful app features.

| Owner | Tasks | Main Files |
|---|---|---|
| Priyam Rangwala | ~~Implement portfolio endpoint and leaderboard endpoint~~ | `routes/portfolio.js`, `routes/leaderboard.js`, `routes/index.js` |
| Alex Lin | ~~Build portfolio and leaderboard pages~~ | `client/src/pages/PortfolioPage.jsx`, `client/src/pages/LeaderboardPage.jsx` |
| Harry Yu | ~~Implement admin resolution endpoint and payout calculation~~ | `routes/markets.js` |
| Alex Markova | ~~Build resolution status display and payout notification UI~~ | market detail/dashboard components |

Deliverable by Wednesday of Week 9:

- ~~User can see current and past positions.~~
- ~~Users can view a leaderboard.~~
- ~~Backend can resolve a market, and frontend admin resolution control exists.~~
- ~~Winners receive payouts through backend resolved market state, and frontend shows resolution feedback.~~

## Phase 4 — Week 9 Thursday-Friday, May 28-29: Tests and Architecture Diagrams

Goal: satisfy rubric items that are not feature work.

| Owner | Tasks | Main Files |
|---|---|---|
| Priyam Rangwala | **NEXT / BEHIND SOON:** Add Playwright setup and first E2E test: register/login, search markets, view market | Playwright config and test files |
| Alex Lin | **NEXT / BEHIND SOON:** Add second E2E test: login, place bet, verify balance/portfolio update | Playwright test files |
| Alex Markova | **NEXT / BEHIND SOON:** Add architecture diagram 1: client-server request flow | `README.md` |
| Harry Yu | **NEXT / BEHIND SOON:** Add architecture diagram 2: database/entity relationship diagram | `README.md` |

Deliverable by Friday of Week 9:

- **NEXT / BEHIND SOON:** At least 2 automated E2E tests pass.
- ~~README contains at least 2 architecture diagrams that match the codebase.~~
- ~~README explains diagrams in prose.~~

## Phase 5 — Week 10 Monday-Wednesday, June 1-3: Polish, Bug Fixing, and Demo Lock

Goal: stop adding risky scope and make the demo reliable.

| Owner | Tasks |
|---|---|
| Harry Yu | Backend bug fixes, API response consistency, demo seed data |
| Priyam Rangwala | Security review, auth/admin edge cases, E2E reliability |
| Alex Markova | README final pass, diagram consistency, navigation polish |
| Alex Lin | UI polish, empty/loading/error states, demo flow checks |

Deliverable by Wednesday of Week 10:

- App runs from clean setup instructions.
- Demo path is rehearsed.
- Tests pass.
- README is complete.
- No large feature PRs remain open.

## Phase 6 — Week 10 Thursday-Friday, June 4-5: Presentation Prep

Goal: only rehearse and patch critical bugs.

Tasks:

- Freeze feature work by Thursday morning.
- Rehearse presentation and demo.
- Verify `README.md` setup instructions on a clean machine or clean clone if possible.
- Verify Playwright tests still pass.
- Each teammate prepares individual contribution notes backed by git commits.
- Keep a fallback demo account and seed data ready.

## Individual Report Prep

The individual report is not code, but the team should prepare evidence while implementing so nobody has to reconstruct it at the end.

Each teammate should keep short notes on:

- Two design decisions they made and alternatives they considered.
- One clean code snippet they personally wrote and why it is readable.
- Construction principles they applied, such as modularity, clean code, debugging, testing, security, reuse, pair programming, or GenAI use.
- Their individual contribution, linked to branch names, PRs, commits, or touched files.
- One thing they would improve if there were more time.
- One mistake or team process issue, what caused it, and what should be done differently next time.

Good evidence sources:

- Small PRs with clear titles.
- Commit messages tied to feature ownership.
- Screenshots or notes from debugging/testing.
- README sections each person contributed to.
- Playwright test results.

## De-Scoped or Optional Work

These should only be attempted after all rubric requirements are satisfied:

- Threaded comments.
- Public profile pages.
- Reply nesting logic.
- Advanced price modeling.
- Real-money-like odds.
- OAuth/Google login.

If the team wants one stretch feature, choose simple public profiles over comments because profiles are easier to isolate and less likely to destabilize the schema.

## Git Workflow

Use feature branches with narrow ownership:

```text
harry-market-search
harry-place-bet-api
priyam-auth-security
alexlin-market-detail-ui
alexmarkova-app-split
alexlin-playwright-betting
```

PR checklist:

- Branch is up to date with `main`.
- PR touches only owned files unless coordination is documented.
- New endpoint has a documented response shape.
- Frontend change has loading and error states.
- Security-sensitive route has auth/admin checks.
- README is updated when setup, scripts, API behavior, or architecture changes.
- E2E tests are updated when core user flows change.

## Minimum Final Feature Set

The team should aim to present these features:

1. ~~Account registration, login, logout, and protected actions.~~
2. ~~Dynamic market feed from SQLite.~~
3. ~~Server-side market search backend and frontend query integration.~~
4. ~~Market card/modal UI with option stats visible before betting.~~
5. ~~Authenticated bet placement with balance deduction.~~
6. ~~Admin market creation.~~
7. ~~Portfolio page.~~
8. ~~Leaderboard page.~~
9. ~~Admin market resolution with payout and frontend admin UI.~~
10. ~~README with local setup, two architecture diagrams, and test instructions.~~
11. **NEXT / BEHIND SOON:** At least two Playwright E2E tests.

This is enough for the team rubric without relying on optional comments/profile work.
