const { test, expect } = require('@playwright/test')

const STARTING_BALANCE = 10000

// note: assumes the test env has >= 1 OPEN market with >= 2 options
const { defineTempUser } = require('./helper')

test.describe('Bet placement and portfolio persistence', () => {
    test('places a bet, sees it in the portfolio, and it persists across logout/login', async ({ page }) => {
        const user = defineTempUser()
        const betAmount = 10
        // sign up through the nav bar just to get a logged-in user; should work bc alr tested in other spec
        await page.goto('/')
        await page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i }).click()
        await expect(page.getByRole('heading', { name: /Sign up for BruinBet/i })).toBeVisible()
        await page.getByRole('textbox', { name: /Username/i }).fill(user.username)
        await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
        await page.getByLabel(/Password/i).fill(user.password)
        await page.getByRole('button', { name: /Create account/i }).click()
        await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()

        // navigate to the markets/home page before looking for bet buttons
        await page.getByRole('button', { name: /^Markets$/i }).click()
        await expect(page.getByRole('heading', { name: /Browse campus predictions before you bet/i })).toBeVisible()

        // need any market so just use first one; before the modal opens the only place bet buttons are the market-card actions
        await page.getByRole('button', { name: /Place bet/i }).first().click()
        const modal = page.getByRole('dialog')
        await expect(modal).toBeVisible()

        // need market name to compare ltr on
        const marketName = (await modal.getByRole('heading').first().innerText()).trim()

        // opinion buttons theoretically should move past just "yes" and "no", so use test id locator
        const firstOption = modal.locator('.bet-option').first()
        const optionLabel = (await firstOption.locator('span').first().innerText()).trim()
        await firstOption.click()
        await modal.locator('.bet-field', { hasText: /Amount/i }).locator('input').fill(String(betAmount))

        // submit --> scope to the dialog so we hit the modal submit and not a market-card
        await modal.getByRole('button', { name: /Place bet/i }).click()

        // strong assertion to check success + exact new balance straight from the API
        await expect(modal.getByText(/new balance/i)).toBeVisible()
        await expect(modal.getByText(`$${(STARTING_BALANCE - betAmount).toLocaleString()}`)).toBeVisible()
        await modal.getByRole('button', { name: /Done/i }).click()

        // go to the portfolio, the position should show the right market, option, and amount
        await page.getByRole('button', { name: /Portfolio/i }).click()
        await expect(page.getByRole('heading', { name: /Portfolio/i })).toBeVisible()
        let position = page.getByRole('article').filter({ hasText: marketName })
        await expect(position.getByRole('heading', { name: marketName })).toBeVisible()
        await expect(position.getByText(optionLabel, { exact: true })).toBeVisible()
        await expect(position.getByText(`$${betAmount.toLocaleString()}`, { exact: true })).toBeVisible()

        // logs out and should lose authenticated state
        await page.getByRole('button', { name: /Logout/i }).click()
        await expect(page.getByText(`Welcome, ${user.username}`)).toHaveCount(0)

        // log back in through the nav bar with the same credentials
        await page.getByLabel('Primary navigation').getByRole('button', { name: /Login/i }).click()
        await expect(page.getByRole('heading', { name: /Log in to BruinBet/i })).toBeVisible()
        await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
        await page.getByLabel(/Password/i).fill(user.password)
        await page.getByRole('button', { name: /Log in/i }).click()
        await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()

        // repeat the portfolio check after re-login to check persistence
        await page.getByRole('button', { name: /Portfolio/i }).click()
        position = page.getByRole('article').filter({ hasText: marketName })
        await expect(position.getByRole('heading', { name: marketName })).toBeVisible()
        await expect(position.getByText(optionLabel, { exact: true })).toBeVisible()
        await expect(position.getByText(`$${betAmount.toLocaleString()}`, { exact: true })).toBeVisible()
    })

    // could've put this w/ the happy-path test, but wanted to keep the insufficient-funds rejection isolated so a failure points straight here
    test('rejects a bet larger than the balance', async ({ page }) => {
        const user = defineTempUser()
        // sign up through the nav bar to get a fresh logged-in user (balance = STARTING_BALANCE)
        await page.goto('/')
        await page.getByLabel('Primary navigation').getByRole('button', { name: /Sign up/i }).click()
        await expect(page.getByRole('heading', { name: /Sign up for BruinBet/i })).toBeVisible()
        await page.getByRole('textbox', { name: /Username/i }).fill(user.username)
        await page.getByRole('textbox', { name: /Email/i }).fill(user.email)
        await page.getByLabel(/Password/i).fill(user.password)
        await page.getByRole('button', { name: /Create account/i }).click()
        await expect(page.getByText(`Welcome, ${user.username}`)).toBeVisible()

        // navigate to the markets/home page before looking for bet buttons
        await page.getByRole('button', { name: /^Markets$/i }).click()
        await expect(page.getByRole('heading', { name: /Browse campus predictions before you bet/i })).toBeVisible()

        // open the modal, pick an outcome, try to bet one dollar over the balance
        await page.getByRole('button', { name: /Place bet/i }).first().click()
        const modal = page.getByRole('dialog')
        await expect(modal).toBeVisible()
        await modal.locator('.bet-option').first().click()
            await modal.locator('.bet-field', { hasText: /Amount/i }).locator('input').fill(String(STARTING_BALANCE + 1))
        await modal.getByRole('button', { name: /Place bet/i }).click()

        // the client guard rejects before any network call: error shows, no success panel
        await expect(modal.getByText(/not enough funds/i)).toBeVisible()
        await expect(modal.getByText(/new balance/i)).toHaveCount(0)
    })

    test('does not offer bet placement to logged-out visitors', async ({ page }) => {
        await page.goto('/')
        // no pathway to place a bet without authenticating first
        await expect(page.getByRole('button', { name: /Place bet/i })).toHaveCount(0)
        await expect(page.getByRole('button', { name: /Sign up to bet/i }).and(page.locator('.primary-button')).first()).toBeVisible()
    })
})
