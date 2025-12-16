import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/login');
        await page.getByLabel('Email').fill('promoter@test.com');
        await page.locator('#password').fill('password123');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await page.waitForURL(/.*dashboard/);
    });

    test('View and Update Profile', async ({ page }) => {
        await page.goto('/profile');

        // Check for profile data
        await expect(page.getByText('Profile')).toBeVisible();

        // Try updating
        await page.getByLabel('Full Name').fill('Updated Name');
        await page.getByRole('button', { name: /save|update/i }).click();

        await expect(page.getByText('Success')).toBeVisible();
    });
});
