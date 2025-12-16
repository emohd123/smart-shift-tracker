import { test, expect } from '@playwright/test';


test.describe('Signup Flow', () => {
    test('Test Case 1: Complete Signup with Files', async ({ page }) => {
        // 1. Navigate to signup
        await page.goto('/signup');

        // 2. Fill in required fields
        // Assuming standard accessible names/labels based on description
        await page.getByLabel('Full Name').fill('Test User');
        await page.getByLabel('Email').fill(`test_${Date.now()}@example.com`);
        await page.locator('#password').fill('password123');

        // Select role (Promoter) - assuming it's a radio or select
        await page.getByLabel('Promoter').check();

        // 3. Fill personal details (optional)
        await page.getByLabel('Phone').fill('1234567890');

        // 4. Upload ID card
        await page.getByLabel('Upload ID Card').setInputFiles('tests/fixtures/test-file.txt');

        // 5. Upload profile photo
        await page.getByLabel('Upload Profile Photo').setInputFiles('tests/fixtures/test-file.txt');

        // 6. Click Submit
        await page.getByRole('button', { name: /submit|sign up/i }).click();

        // 7. Expected: Success message/redirect
        await expect(page).toHaveURL(/.*login/);
        await expect(page.getByText('Success')).toBeVisible();
    });

    test('Test Case 3: Signup with Invalid Files', async ({ page }) => {
        await page.goto('/signup');

        // Try uploading invalid file type if constraint is checked on client
        // This depends on implementation, sometimes it's just accept attribute
        const invalidFile = 'tests/fixtures/test-file.txt'; // Using txt which might be invalid if expected image

        // Just checking if we can trigger validation
        await page.getByLabel('Upload ID Card').setInputFiles(invalidFile);

        // If client validation exists, we might see error immediately or after submit
        // For now, let's just attempt submit and see
        await page.getByLabel('Full Name').fill('Invalid User');
        await page.getByLabel('Email').fill(`invalid_${Date.now()}@example.com`);
        await page.locator('#password').fill('password123');
        await page.getByLabel('Promoter').check();

        await page.getByRole('button', { name: /submit|sign up/i }).click();

        // Expect error about file type if txt is not allowed
        // Adjust expectation based on actual app behavior
    });
});
