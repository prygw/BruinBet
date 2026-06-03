# Spec Card: User can place a bet, see it in their portfolio, and see it still show up after logout/re-login

## Behavior
A signed-in user picks an outcome on any open market, bets an amount that they can afford, and sees the position reflected in their portfolio (both immediately and after logging out and back in).

## Should pass when
- Market cards are restyled or reordered, as long as at least one has a `Place bet` button.
- The bet modal is redesigned, as long as the outcome options, amount field, submit button, and success panel remain.
- The portfolio page is restructured, as long as positions are still `article` elements containing the market name, option label, and stake amount.
- The nav bar `Login`, `Logout`, and `Portfolio` buttons are restyled.

## Should fail when
- Placing a bet does not produce a success panel or updated balance.
- The new balance shown after betting does not equal `STARTING_BALANCE - stake`.
- The portfolio does not show the correct market name, option label, or stake amount immediately after betting.
- The portfolio position is missing after logout and re-login (persistence failure).
- A bet larger than the balance does not show a "not enough funds" error.
- A bet larger than the balance shows a success panel or deducts from the balance.
- A logged-out visitor can see `Place bet` buttons.

## Locator contract
- `getByRole('button', { name: /^Markets$/i })` — nav bar markets entry point
- `getByRole('heading', { name: /Browse campus predictions before you bet/i })` — markets page landmark
- `getByRole('button', { name: /Place bet/i }).first()` — first market card action (any open market)
- `getByRole('dialog')` — bet modal
- `modal.getByRole('heading').first()` — market name inside modal
- `modal.locator('.bet-option').first()` — first outcome option
- `modal.locator('.bet-field', { hasText: /Amount/i }).locator('input')` — stake amount input
- `modal.getByRole('button', { name: /Place bet/i })` — modal submit (scoped to dialog to avoid matching card buttons behind backdrop)
- `modal.getByRole('button', { name: /Done/i })` — success panel dismiss
- `getByRole('button', { name: /Portfolio/i })` — nav bar portfolio entry point
- `getByRole('article').filter({ hasText: marketName })` — portfolio position card
- `getByRole('button', { name: /Sign up to bet/i }).first()` — logged-out market card CTA

## Oracle
- After placing a bet: modal shows "new balance" and `$${STARTING_BALANCE - stake}`.
- After dismissing: portfolio shows the correct market name, option label, and stake amount.
- After logout and re-login: the same portfolio position is still present.
- Over-balance attempt: modal shows "not enough funds", no success panel appears.
- Logged-out home page: no `Place bet` buttons anywhere, at least one `Sign up to bet` button visible.
