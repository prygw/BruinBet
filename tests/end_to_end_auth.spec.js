const { test, expect } = require('@playwright/test')

const adminCredentials = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
}

const { defineTempUser } = require('./helper')

test.describe('Authentication and access control pipeline', () => {
  test('signs up a new user through home page, logs out, then logs back in again', async ({ page }) => {
    const user = defineTempUser()

    // clicking the home page sign up pathway
    await page.goto('/')
    await page.getByRole('button', { name: /Sign up to bet/i }).and(page.locator('.primary-button')).click() // note:test the home page call-to-action, not the nav bar sign up
    await expect(page.getByRole('heading', { name: /Sign up for BruinBet/i })).toBeVisible()
    // user fills out form and submits
    await page.getByRole('textbox', { name: /Username/i }).fill(user.username)
    await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
    await page.getByLabel(/Password/i).fill(user.password)
    await page.getByRole('button', { name: /Create account/i }).click()

    // exact welcome message for this user --> purposefully strong because this text will never change, and it confirms that the user is properly logged in as the correct user
    await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Login/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Sign up to bet/i }).and(page.locator('.primary-button'))).toHaveCount(0)

    // logs out and should lose authenticated state
    await page.getByRole('button', { name: /Logout/i }).click()
    await expect(page.getByText(`Welcome, ${user.username}`)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Logout/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Login/i }).and(page.locator('.secondary-button'))).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign up to bet/i }).and(page.locator('.primary-button'))).toBeVisible()

    // click login button on the home page, not the nav bar
    await page.getByRole('button', { name: /Login/i }).and(page.locator('.secondary-button')).click()
    await expect(page.getByRole('heading', { name: /Log in to BruinBet/i })).toBeVisible()
    // fills out login form with same credentials and submits
    await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
    await page.getByLabel(/Password/i).fill(user.password)
    await page.getByRole('button', { name: /Log in/i }).click()

    // repeat test here; just for login instead of sign up
    await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Login/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Sign up/i })).toHaveCount(0)
  })

  // could've combined this with the previous test, but wanted to explicitly test the nav bar pathways as well and distinguish them from the home page signup/login errors
  test('signs up a new user through the nav bar, logs out, then logs back in through the nav bar', async ({ page }) => {
    const user = defineTempUser()

    // clicking the nav bar sign up pathway
    await page.goto('/')
    await page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i }).click() // note: tests the nav bar sign up flow, not only home page CTA
    await expect(page.getByRole('heading', { name: /Sign up for BruinBet/i })).toBeVisible()
    // user fills out form and submits
    await page.getByRole('textbox', { name: /Username/i }).fill(user.username)
    await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
    await page.getByLabel(/Password/i).fill(user.password)
    await page.getByRole('button', { name: /Create account/i }).click()

    // strong assertion: exact welcome message for this user
    await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible()
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Login/i })).toHaveCount(0)
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i })).toHaveCount(0)

    // logs out and should lose authenticated state
    await page.getByRole('button', { name: /Logout/i }).click()
    await expect(page.getByText(`Welcome, ${user.username}`)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Logout/i })).toHaveCount(0)
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Login/i })).toBeVisible()
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i })).toBeVisible()

    // click login button in the nav bar
    await page.getByLabel('Primary navigation').getByRole('button', { name: /Login/i }).click()
    await expect(page.getByRole('heading', { name: /Log in to BruinBet/i })).toBeVisible()
    // fills out login form with same credentials and submits
    await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
    await page.getByLabel(/Password/i).fill(user.password)
    await page.getByRole('button', { name: /Log in/i }).click()

    // should get exact welcome message again
    await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible()
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Login/i })).toHaveCount(0)
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i })).toHaveCount(0)
  })

  test('does not show protected navigation to logged-out visitors', async ({ page }) => {
    await page.goto('/')
    // not logged in, should not see dashboard, portfolio, or admin buttons
    await expect(page.getByRole('button', { name: /portfolio/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /dashboard/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /admin/i })).toHaveCount(0)
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /login/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign up$/i })).toBeVisible()
  })

  test('hides bet placement from admins and shows admin controls', async ({ page }) => {
    // login
    await page.goto('/')
    await page.getByLabel('Primary navigation').getByRole('button', { name: /login/i }).click()
    // use admin credentials from environment variables to log in as admin
    await page.getByRole('textbox', { name: /email/i }).fill(adminCredentials.email)
    await page.getByLabel(/password/i).fill(adminCredentials.password)
    await page.getByRole('button', { name: /log in/i }).click()
    // should see admin welcome and button, but no place bet buttons
    await expect(page.getByText(/welcome, admin/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /admin/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /portfolio/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /place bet/i })).toHaveCount(0)
  })

  test('does not show admin controls to a regular authenticated user', async ({ page }) => {
    const user = defineTempUser()

    // sign up as a normal user (reusing the nav bar pathway since home page is already covered)
    await page.goto('/')
    await page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i }).click()
    await page.getByRole('textbox', { name: /Username/i }).fill(user.username)
    await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
    await page.getByLabel(/Password/i).fill(user.password)
    await page.getByRole('button', { name: /Create account/i }).click()

    // confirm we're actually logged in before asserting absence
    await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()

    // non-admin should not see any admin entry points
    await expect(page.getByRole('button', { name: /admin/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /admin/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /manage markets/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /create market/i })).toHaveCount(0)
  })
})
