import { spawn } from 'child_process';
import { createConnection } from 'net';

const PORT = 4200;
const APP_URL = `http://localhost:${PORT}`;

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const connection = createConnection({ port, host: 'localhost' });
      await new Promise((resolve, reject) => {
        connection.on('connect', () => {
          connection.end();
          resolve();
        });
        connection.on('error', reject);
        connection.setTimeout(1000);
      });
      console.log(`✓ Server is ready on port ${port}`);
      return true;
    } catch (err) {
      if (i < maxAttempts - 1) {
        console.log(`Waiting for server... (${i + 1}/${maxAttempts})`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw new Error(`Server did not start on port ${port} after ${maxAttempts} attempts`);
}

async function runScreenshot() {
  let serverProcess;
  try {
    // Build production
    console.log('Building production...');
    await new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
      });
      buildProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });
    });

    // Start production server
    console.log('Starting production server...');
    serverProcess = spawn('npx', ['serve', 'dist', '-l', String(PORT)], {
      stdio: 'inherit',
      shell: true,
    });

    // Wait for server to be ready
    await waitForServer(PORT);

    // Wait a bit more to ensure app is fully loaded
    await new Promise((r) => setTimeout(r, 3000));

    // Run screenshot script
    console.log('Taking screenshot...');
    const screenshotProcess = spawn('node', ['scripts/take-screenshot.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, APP_URL },
    });

    // Wait for screenshot to complete
    await new Promise((resolve, reject) => {
      screenshotProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Screenshot script failed with exit code ${code}`));
        }
      });
    });

    console.log('✓ Screenshot completed successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log('Stopping server...');
      serverProcess.kill('SIGTERM');
    }
  }
}

runScreenshot();
