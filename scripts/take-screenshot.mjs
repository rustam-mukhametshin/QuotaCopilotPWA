import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const screenshotDir = resolve(projectRoot, 'public', 'screenshots');
const screenshotPath = resolve(screenshotDir, 'app-preview.png');
const appUrl = process.env.APP_URL || 'http://localhost:4200';

// Ensure the screenshots directory exists
if (!existsSync(screenshotDir)) {
  mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot() {
  let browser;
  try {
    console.log(`Taking screenshot of ${appUrl}...`);
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Navigate to the app and wait for network to be idle
    await page.goto(appUrl, { waitUntil: 'networkidle' });

    // Take the screenshot
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot saved to ${screenshotPath}`);

    await context.close();
  } catch (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

takeScreenshot();
