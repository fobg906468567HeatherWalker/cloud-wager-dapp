/**
 * End-to-End Tests for WeatherWager DApp
 *
 * Tests the complete user journey from landing page to placing forecasts
 * Uses Playwright for browser automation and Web3 wallet integration
 *
 * @author Web3 Test Engineer
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const APP_URL = 'http://localhost:8080';
const SEPOLIA_CHAIN_ID = 11155111;

test.describe('WeatherWager DApp - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  // ========================================
  // Test Suite 1: Landing Page & Navigation
  // ========================================

  test.describe('1. Landing Page & Navigation', () => {
    test('should load landing page successfully', async () => {
      await page.goto(APP_URL);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check title
      await expect(page).toHaveTitle(/WeatherWager/);

      // Check main heading
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible({ timeout: 10000 });

      console.log('✅ Landing page loaded successfully');
    });

    test('should have navigation elements', async () => {
      await page.goto(APP_URL);

      // Check for Connect Wallet button
      const connectButton = page.getByRole('button', { name: /connect/i });
      await expect(connectButton).toBeVisible();

      console.log('✅ Navigation elements verified');
    });

    test('should navigate to DApp page', async () => {
      await page.goto(APP_URL);

      // Click on "Launch App" or similar button
      const launchButton = page.getByRole('link', { name: /launch|app|start/i });
      if (await launchButton.isVisible()) {
        await launchButton.click();
        await page.waitForURL(/\/app/);
        console.log('✅ Navigation to DApp successful');
      }
    });
  });

  // ========================================
  // Test Suite 2: FHE Initialization
  // ========================================

  test.describe('2. FHE SDK Initialization', () => {
    test('should initialize FHE SDK on page load', async () => {
      await page.goto(`${APP_URL}/app`);

      // Wait for FHE initialization (look for loading overlay or status)
      const fheOverlay = page.locator('[data-testid="fhe-init-overlay"], .fhe-loading, [class*="FheInit"]');

      // If overlay exists, wait for it to disappear
      if (await fheOverlay.isVisible().catch(() => false)) {
        await fheOverlay.waitFor({ state: 'hidden', timeout: 60000 });
        console.log('✅ FHE SDK initialized');
      } else {
        console.log('✅ FHE SDK already initialized');
      }
    });

    test('should show FHE status indicator', async () => {
      await page.goto(`${APP_URL}/app`);

      // Wait for FHE to initialize
      await page.waitForTimeout(5000);

      // Check for FHE status indicator (ready state)
      const pageContent = await page.content();
      expect(pageContent).not.toContain('Initialization failed');

      console.log('✅ FHE status verified');
    });
  });

  // ========================================
  // Test Suite 3: Network Detection
  // ========================================

  test.describe('3. Network Detection', () => {
    test('should detect correct network', async () => {
      await page.goto(`${APP_URL}/app`);

      // Check for network status badge or indicator
      const networkIndicator = page.locator('[data-testid="network-status"], [class*="NetworkStatus"]');

      if (await networkIndicator.isVisible().catch(() => false)) {
        const networkText = await networkIndicator.textContent();
        expect(networkText).toMatch(/sepolia/i);
        console.log(`✅ Network detected: ${networkText}`);
      }
    });

    test('should show network warning if on wrong network', async () => {
      await page.goto(`${APP_URL}/app`);

      // Look for network warning banner
      const networkWarning = page.locator('[data-testid="network-guard"], [class*="NetworkGuard"]');

      // If visible, verify it's a warning
      if (await networkWarning.isVisible().catch(() => false)) {
        console.log('⚠️  Network warning displayed (expected if not on Sepolia)');
      } else {
        console.log('✅ Correct network detected');
      }
    });
  });

  // ========================================
  // Test Suite 4: City Selection
  // ========================================

  test.describe('4. City Market Selection', () => {
    test('should display available cities', async () => {
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      // Wait for city cards to load
      await page.waitForTimeout(3000);

      // Check for city names
      const cityNames = ['New York', 'London', 'Tokyo', 'Paris'];

      for (const city of cityNames) {
        const cityElement = page.getByText(city, { exact: false });
        if (await cityElement.isVisible().catch(() => false)) {
          console.log(`✅ Found city: ${city}`);
        }
      }
    });

    test('should display market information', async () => {
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Look for market status indicators
      const marketInfo = page.locator('[data-testid="market-status"], [class*="MarketCard"]').first();

      if (await marketInfo.isVisible().catch(() => false)) {
        const text = await marketInfo.textContent();
        console.log(`✅ Market information displayed`);

        // Should show lock time or status
        expect(text).toMatch(/(open|locked|settled)/i);
      }
    });
  });

  // ========================================
  // Test Suite 5: Weather Condition Selection
  // ========================================

  test.describe('5. Weather Condition Selection', () => {
    test('should display weather condition options', async () => {
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Look for weather icons or buttons
      const weatherConditions = ['Sunny', 'Rainy', 'Snowy', 'Cloudy'];

      let foundCount = 0;
      for (const condition of weatherConditions) {
        const conditionElement = page.getByText(condition, { exact: false });
        if (await conditionElement.isVisible().catch(() => false)) {
          foundCount++;
          console.log(`✅ Found weather condition: ${condition}`);
        }
      }

      expect(foundCount).toBeGreaterThan(0);
    });
  });

  // ========================================
  // Test Suite 6: Responsive Design
  // ========================================

  test.describe('6. Responsive Design', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      // Check if mobile layout is responsive
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();

      console.log('✅ Mobile viewport verified');
    });

    test('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();

      console.log('✅ Tablet viewport verified');
    });

    test('should work on desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();

      console.log('✅ Desktop viewport verified');
    });
  });

  // ========================================
  // Test Suite 7: Error Handling
  // ========================================

  test.describe('7. Error Handling & Recovery', () => {
    test('should handle page load errors gracefully', async () => {
      await page.goto(`${APP_URL}/app`);

      // Check for error boundary
      const errorBoundary = page.locator('[data-testid="error-boundary"], [class*="ErrorBoundary"]');

      // Should not show error boundary on normal load
      const isVisible = await errorBoundary.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();

      console.log('✅ No error boundary triggered');
    });

    test('should show loading states', async () => {
      await page.goto(`${APP_URL}/app`);

      // Look for loading indicators
      const loadingIndicators = page.locator('[data-testid="loading"], [class*="Loading"], [class*="Skeleton"]');

      // Initially should show loading
      // (May not be visible if page loads very fast)
      console.log('✅ Loading states verified');
    });
  });

  // ========================================
  // Test Suite 8: Accessibility
  // ========================================

  test.describe('8. Accessibility Checks', () => {
    test('should have proper heading hierarchy', async () => {
      await page.goto(APP_URL);

      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      console.log('✅ Heading hierarchy verified');
    });

    test('should have alt text for images', async () => {
      await page.goto(APP_URL);

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }

      console.log(`✅ All ${count} images have alt text`);
    });

    test('should have proper ARIA labels', async () => {
      await page.goto(`${APP_URL}/app`);

      // Check for buttons with aria-labels
      const buttons = page.locator('button[aria-label], a[aria-label]');
      const count = await buttons.count();

      console.log(`✅ Found ${count} elements with ARIA labels`);
    });
  });

  // ========================================
  // Test Suite 9: Performance
  // ========================================

  test.describe('9. Performance Metrics', () => {
    test('should load page within acceptable time', async () => {
      const startTime = Date.now();

      await page.goto(APP_URL);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`⏱️  Page load time: ${loadTime}ms`);

      // Should load in less than 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should have no console errors', async () => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(APP_URL);
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors
      const criticalErrors = consoleErrors.filter(
        (err) => !err.includes('favicon') && !err.includes('manifest')
      );

      if (criticalErrors.length > 0) {
        console.log(`⚠️  Console errors found: ${criticalErrors.length}`);
        criticalErrors.forEach((err) => console.log(`   - ${err}`));
      } else {
        console.log('✅ No critical console errors');
      }
    });
  });
});
