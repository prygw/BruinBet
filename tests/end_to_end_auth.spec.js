// TODO IF TIME: check other non-primary sign up / login pathways (e.g. "Sign up to bet" on home page, "Login" on home page) 

const { test, expect } = require('@playwright/test')

const adminCredentials = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
}

function defineTempUser() {
  const randomConcat = Date.now().toString().slice(-5) // unique username and email to avoid conflicts w/ existing users
  return {
    username: `sixseven${randomConcat}`,
    email: `sixseven${randomConcat}@g.ucla.edu`,
    password: 'password123',
  }
}

test.describe('Authentication and access control pipeline', () => {
  test('signs up a new user, logs out, then logs back in again', async ({ page }) => {
    const user = defineTempUser()

    // clicking the sign up button
    await page.goto('/')
    await page.getByRole('button', { name: /^sign up$/i }).click() // note: doesn't test "Sign up to bet" pathway
    await expect(page.getByRole('heading', { name: /sign up for bruinbet/i })).toBeVisible()
    // user fills out form and submits
    await page.getByRole('textbox', { name: /username/i }).fill(user.username)
    await page.getByRole('textbox', { name: /email/i }).fill(user.email)
    await page.getByLabel(/password/i).fill(user.password)
    await page.getByRole('button', { name: /create account/i }).click()
    // should be logged in and see a welcome w/ username
    await expect(page.getByText(/welcome, /i)).toBeVisible()
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
    // logs out
    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page.getByLabel('Primary navigation').getByRole('button', { name: /login/i })).toBeVisible()
    // click login button
    await page.getByLabel('Primary navigation').getByRole('button', { name: /login/i }).click() // note: doesn't test "Login" in on home page; tests the nav bar login button
    await expect(page.getByRole('heading', { name: /log in to bruinbet/i })).toBeVisible()
    // fills out login form w/ same credentials as sign upand submits
    await page.getByRole('textbox', { name: /email/i }).fill(user.email)
    await page.getByLabel(/password/i).fill(user.password)
    await page.getByRole('button', { name: /log in/i }).click()
    // should be logged in and see welcome w/ username again
    await expect(page.getByText(/welcome, /i)).toBeVisible()
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
    await expect(page.getByRole('button', { name: /place bet/i })).toHaveCount(0)
  })
})
