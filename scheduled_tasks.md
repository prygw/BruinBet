# BruinBets — Task Clusters & Assignments

Each cluster contains tasks that can be worked on **concurrently** (FE and BE in parallel). Clusters are ordered sequentially by dependency.

Every team member gets **3 frontend + 3 backend rotations**.

---

## Cluster 1 — Week 4: Authentication Foundation

**User Stories: 1 (Create Account), 2 (Login), 3 (Logout)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Alex Markova, Harry Yu | Registration page, login page, logout button/nav, route guards |
| **BE** | Alex Lin, Priyam, Hao Gu | User model/DB schema, auth API, UCLA email validation, session management, initial 10k balance |

---

## Cluster 2 — Week 5: Markets & Bet Creation

**User Stories: 4 (Bet Creation), 7 (View All Active Markets)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Alex Lin, Priyam, Hao Gu | Admin create-bet form, home page market feed, bet cards (title, prices, liquidity, time remaining) |
| **BE** | Alex Markova, Harry Yu | Bet model, create/read endpoints, active markets query, status filtering (Open/Resolved/Expired) |

---

## Cluster 3 — Week 6: Core Betting

**User Stories: 5 (Place a Bet), 8 (View Specific Market)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Alex Markova, Hao Gu | Bet detail page, placement UI (wager input, position select), dynamic balance/totals update |
| **BE** | Alex Lin, Priyam, Harry Yu | Place-bet API, balance validation & deduction, single-market stats endpoint (prices, liquidity, bet count) |

---

## Cluster 4 — Week 7: Prize Resolution

**User Story: 6 (Prize Distribution)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Priyam, Harry Yu, Hao Gu | Resolution status display, balance update UI, payout notifications |
| **BE** | Alex Lin, Alex Markova | Admin resolve endpoint, proportional payout calculation, winner/loser status updates |

---

## Cluster 5 — Week 8: Portfolio & Leaderboard

**User Stories: 9 (Portfolio Tracking), 10 (Leaderboard)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Alex Lin, Priyam | Portfolio page (current/past positions), leaderboard page (ranked list) |
| **BE** | Alex Markova, Harry Yu, Hao Gu | Positions API, bet history with P&L, leaderboard ranking query |

---

## Cluster 6 — Week 9: Nice-to-Haves

**User Stories: 11 (View Profiles), 12 (Bet Discussion)**

| Role | Members | Tasks |
|------|---------|-------|
| **FE** | Alex Lin, Alex Markova, Harry Yu | Public profile page (display name, win/loss), comment/reply UI with threading |
| **BE** | Priyam, Hao Gu | Public profile API, comments CRUD, nested reply logic |

---

## Role Balance Summary

| Member | FE Clusters | BE Clusters |
|--------|:-----------:|:-----------:|
| Alex Lin | 2, 5, 6 | 1, 3, 4 |
| Alex Markova | 1, 3, 6 | 2, 4, 5 |
| Priyam | 2, 4, 5 | 1, 3, 6 |
| Harry Yu | 1, 4, 6 | 2, 3, 5 |
| Hao Gu | 2, 3, 4 | 1, 5, 6 |

Each person does exactly **3 frontend + 3 backend** stints across the project.

**Milestone alignment:** Cluster 1 = Milestone 1, Clusters 2–3 = Milestone 2, Clusters 4–6 = Milestone 3.
