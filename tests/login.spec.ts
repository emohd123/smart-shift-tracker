import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('Login and Redirect', async ({ page }) => {
        // We need a user to login. 
        // Ideal way is to seed DB or signup a user first.
        // For this test suite, we might depend on the signup test or just fail if no user.
        // Let's assume we can use the user created in signup test if we run in serial.
        // Or better, let's create a fresh user for this test to be independent.

        await page.goto('/login');

        // Use seeded company credentials
        await page.getByLabel('Email').fill('company@test.com');
        await page.locator('#password').fill('password123'); // Password from seed.ts
        await page.getByRole('button', { name: /login|sign in/i }).click();

        // Expect redirect to company dashboard
        // Note: Dashboard component redirects 'company' role to '/company'
        await expect(page).toHaveURL(/.*company/);
    });
});


