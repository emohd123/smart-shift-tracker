
import { test, expect } from '@playwright/test';

test.describe('Dashboard Access', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate as Promoter
        await page.goto('/login');
        await page.getByLabel('Email').fill('promoter@test.com');
        await page.locator('#password').fill('password123');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await page.waitForURL(/.*dashboard/);
    });

    test('Promoter Dashboard Elements', async ({ page }) => {
        // Assertions based on "Testing Guide"
        await expect(page.getByText('Welcome')).toBeVisible();
        await expect(page.getByText('Shifts')).toBeVisible();
    });
});
