# Spec Card: User can sign up, log out, then log back in again

## Behavior
A new user registers via either the home page or nav bar, signs out, and logs back in, seeing the correct authenticated or unauthenticated UI at each step and with admins and only admins seeing admin-only controls.

## Should pass when
- The home page auth buttons are restyled, recoloured, or repositioned.
- The nav bar is restructured, as long as `Primary navigation` remains the accessible label for buttons that were intially at the top.
- The registration or login form layout changes, as long as inputs stay labelled `Username`, `Email`, and `Password`.
- The welcome message is reformatted, as long as it still contains the 'Welcome {generated username}'.
- The admin controls are moved or relabelled, as long as they match the locator contract pattern.
- Any of the CSS names of the buttons/text-values change EXCEPT for the 'Sign up to Bet' button and 'Login' button, which rely on CSS names to distinguish themselves.

## Should fail when
- Sign up does not create a real authenticated session — `Welcome, <username>` never appears after `Create account`.
- Logout does not clear signed-in state — `Welcome, <username>`, `Logout`, `Login`, or `Sign up to bet` persist or disappear when they shouldn't.
- Login does not accept the credentials created during sign up — `Welcome, <username>` never appears after `Log in`.
- The home page `Login` or `Sign up to bet` buttons are absent after logout (test 1 only).
- The nav bar `Login` or `Sign up` buttons are absent after logout (test 2 only).
- The registration heading (`Sign up for BruinBet`) or login heading (`Log in to BruinBet`) never appears after clicking the respective entry point.
- An admin session does not show `Welcome, admin` or the admin button.
- An admin session still shows `Place bet` buttons.

## Locator contract
- `getByRole('button', { name: /Sign up to bet/i })` for the home page sign-up CTA
- `getByRole('button', { name: /Login/i })` for the home page login CTA
- `getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i })` for the nav bar sign-up entry point
- `getByLabel('Primary navigation').getByRole('button', { name: /Login/i })` for the nav bar login entry point
- `getByRole('heading', { name: /Sign up for BruinBet/i })` to verify the registration page
- `getByRole('textbox', { name: /Username/i })` for username input
- `getByRole('textbox', { name: /Email/i })` for email input
- `getByLabel(/Password/i)` for password input
- `getByRole('button', { name: /Create account/i })` to submit registration
- `getByRole('button', { name: /Log in/i })` to submit login
- `getByRole('button', { name: /Logout/i })` to end the session
- `getByText('Welcome, <generated username>')` to assert authenticated state for the created user
- `getByText(/Admin|Manage markets|Create market/i)` or equivalent admin landing controls for admin users where applicable

## Oracle
- After registration: `Welcome, <username>` is visible and a logout button appears; home page auth buttons are gone.
- After logout: home page shows `Login` and `Sign up to bet` again.
- After nav bar login: `Welcome, <username>` reappears; `Login` and `Sign up` disappear from the nav.
- Admin session: admin-specific controls are present.
- Non-admin session: no admin controls are present.
