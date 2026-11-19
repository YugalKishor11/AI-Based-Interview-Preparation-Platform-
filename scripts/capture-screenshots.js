import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const WIDTHS = [360, 768, 1024, 1440, 1920];
const THEMES = ['dark', 'light'];

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'dashboard', path: '/app' },
  { name: 'setup', path: '/app/interview/new' },
  { name: 'interviewers', path: '/app/interview/new/interviewer' },
  { name: 'device', path: '/app/interview/check' },
  { name: 'report', path: '/app/reports/rep-101' },
  { name: 'practice', path: '/app/practice' },
  { name: 'history', path: '/app/history' },
  { name: 'settings', path: '/app/settings' },
  { name: 'credits', path: '/app/credits' },
  { name: 'showcase', path: '/dev/showcase' },
];

async function run() {
  console.log('--- Starting Vite Preview Server via API on port 4173 ---');
  const server = await preview({
    preview: {
      port: 4173,
      strictPort: true,
    },
  });

  const baseUrl = 'http://localhost:4173';
  console.log(`--- Server ready at ${baseUrl} ---`);

  console.log('--- Launching Headless Chromium ---');
  const browser = await chromium.launch();

  try {
    for (const theme of THEMES) {
      console.log(`\n=== Testing Theme: ${theme.toUpperCase()} ===`);

      for (const route of ROUTES) {
        for (const width of WIDTHS) {
          const height = width < 768 ? 840 : 900;
          const context = await browser.newContext({
            viewport: { width, height },
          });
          const page = await context.newPage();

          // Listen for console errors
          const consoleErrors = [];
          page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });

          await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });

          // Set theme & effects mode
          await page.evaluate((t) => {
            document.documentElement.setAttribute('data-theme', t);
            document.documentElement.setAttribute('data-effects', 'full');
            localStorage.setItem('prepsphere_theme', t);
            localStorage.setItem('prepsphere_effects', 'full');
          }, theme);

          await page.waitForTimeout(300);

          // Check horizontal overflow
          const hasHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          if (hasHorizontalOverflow) {
            console.warn(`[OVERFLOW WARN] Horizontal scroll on ${route.name} at ${width}px (${theme})`);
          }

          if (consoleErrors.length > 0) {
            console.warn(`[CONSOLE ERRORS on ${route.name}]:`, consoleErrors);
          }

          const filename = path.join(SCREENSHOT_DIR, `${route.name}-${theme}-${width}.png`);
          await page.screenshot({ path: filename, fullPage: false });
          console.log(`✓ Captured: ${route.name}-${theme}-${width}.png`);

          await context.close();
        }
      }
    }

    // Specific live room operational states at 1440px
    console.log('\n=== Capturing Live Room Operational States (1440px) ===');
    const roomContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const roomPage = await roomContext.newPage();
    await roomPage.goto(`${baseUrl}/app/interview/live-101/live`, { waitUntil: 'networkidle' });

    // 1. Speaking state
    await roomPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'room-speaking-dark-1440.png'),
    });
    console.log('✓ Captured: room-speaking-dark-1440.png');

    // 2. Listening state
    await roomPage.evaluate(() => {
      const orb = document.querySelector('.ai-orb');
      if (orb) orb.setAttribute('data-state', 'listening');
    });
    await roomPage.waitForTimeout(200);
    await roomPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'room-listening-dark-1440.png'),
    });
    console.log('✓ Captured: room-listening-dark-1440.png');

    // 3. Thinking state
    await roomPage.evaluate(() => {
      const orb = document.querySelector('.ai-orb');
      if (orb) orb.setAttribute('data-state', 'thinking');
    });
    await roomPage.waitForTimeout(200);
    await roomPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'room-thinking-dark-1440.png'),
    });
    console.log('✓ Captured: room-thinking-dark-1440.png');

    // 4. Reconnecting state
    await roomPage.evaluate(() => {
      const orb = document.querySelector('.ai-orb');
      if (orb) orb.setAttribute('data-state', 'reconnecting');
    });
    await roomPage.waitForTimeout(200);
    await roomPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'room-reconnecting-dark-1440.png'),
    });
    console.log('✓ Captured: room-reconnecting-dark-1440.png');

    await roomContext.close();
  } finally {
    await browser.close();
    server.httpServer.close();
    console.log('\n--- Screenshot Capture Loop Complete ---');
  }
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});
