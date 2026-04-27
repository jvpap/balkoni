import { expect, test } from '@playwright/test';

test('Startseite lädt mit Titel und Hauptkomponenten', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Balkon-Dielen-Planer');

	// Canvas vorhanden (Konva rendert ein <canvas> innerhalb des Stage-Containers)
	await expect(page.locator('canvas').first()).toBeVisible();

	// Sidebar mit Eingabebereich vorhanden, Toggle-Button funktioniert
	const toggle = page.getByRole('button', { name: /Eingabe (ein|aus)blenden/ });
	await expect(toggle).toBeVisible();
});

test('Sidebar lässt sich ein- und ausklappen', async ({ page }) => {
	await page.goto('/');
	const toggle = page.getByRole('button', { name: /Eingabe ausblenden/ });
	await expect(toggle).toBeVisible();
	await toggle.click();
	await expect(page.getByRole('button', { name: /Eingabe einblenden/ })).toBeVisible();
});
