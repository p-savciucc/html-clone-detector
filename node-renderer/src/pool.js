import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import {
  BASE_OUTPUT_DIR,
  OUTPUT_FILE,
  SCREENSHOT_DIR,
  ERROR_LOG_FILE,
  MAX_CONCURRENCY,
  SCREENSHOT_TIMEOUT_MS,
  PAGE_TIMEOUT
} from "./constants.js";

export class ProcessingPool {
  constructor() {
    this.taskQueue = [];
    this.results = [];
    this.errorBuffer = [];

    this.progress = {
      total: 0,
      completed: 0,
      errors: 0,
      startTime: Date.now(),
      lastUpdate: 0
    };

    this.tierStats = {};
    this.activeWorkers = 0;
    this.browser = null;
  }

  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--js-flags="--noexpose_wasm"'
      ],
      ignoreHTTPSErrors: true
    });
  }

  async createWorker() {
    const page = await this.browser.newPage();
    await page.setJavaScriptEnabled(false);

    await page.setRequestInterception(true);
    const cache = new Set();

    page.on('request', (req) => {
      const url = req.url();
      if (cache.has(url)) {
        req.abort();
        return;
      }
      if (['image','stylesheet','font','media'].includes(req.resourceType())) {
        cache.add(url);
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 0.5 });
    return page;
  }

  async processFile(page, fileObj) {
    const { filepath, tier } = fileObj;
    try {
      await page.goto(`file://${path.resolve(filepath)}`, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_TIMEOUT
      });

      const screenshotPath = path.join(SCREENSHOT_DIR, tier, `${path.basename(filepath)}.jpg`);
      await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });

      try {
        await page.screenshot({
          path: screenshotPath,
          type: 'jpeg',
          quality: 80,
          timeout: SCREENSHOT_TIMEOUT_MS
        });
      } catch (screenshotError) {
        this.logError(filepath, `Screenshot failed: ${screenshotError.message}`);
      }

      const textContent = await page.evaluate(() => 
        document.body.innerText.replace(/[\n\r]+/g, '\n').trim()
      );

      return {
        ...fileObj,
        text: textContent,
        screenshot: screenshotPath,
        error: null
      };
    } catch (error) {
      this.logError(filepath, error.message);
      return { ...fileObj, error: error.message };
    }
  }

  logError(filepath, message) {
    const entry = `[${new Date().toISOString()}] ${filepath} - ${message}`;
    this.errorBuffer.push(entry);
    this.progress.errors++;
  }

  async processAll(files) {
    await this.initBrowser();

    this.progress.total = files.length;
    this.taskQueue.push(...files);

    for (const f of files) {
      if (!this.tierStats[f.tier]) {
        this.tierStats[f.tier] = { total: 0, done: 0 };
      }
      this.tierStats[f.tier].total++;
    }

    const workers = Array.from({ length: MAX_CONCURRENCY }, () => this.workerHandler());
    await Promise.all(workers);

    this.updateProgress(null, true);

    await this.browser.close();
  }

  async workerHandler() {
    const page = await this.createWorker();
    while (this.taskQueue.length > 0) {
      const fileObj = this.taskQueue.pop();
      const result = await this.processFile(page, fileObj);
      this.results.push(result);

      this.progress.completed++;
      this.tierStats[fileObj.tier].done++;

      this.updateProgress(fileObj.tier, false);
    }
    await page.close();
  }

  updateProgress(lastTier, forceFinal = false) {
    const now = Date.now();
    if (!forceFinal && now - this.progress.lastUpdate < 250) {
      return;
    }

    const elapsed = (now - this.progress.startTime) / 1000;
    const done = this.progress.completed;
    const total = this.progress.total;

    const ratio = done / total;
    const speed = done / (elapsed || 1);
    let etaSec = (total - done) / (speed || 1);
    if (etaSec < 0) etaSec = 0;

    let tierName = lastTier || "final";
    let tierDone = 0;
    let tierTotal = 0;

    if (lastTier && this.tierStats[lastTier]) {
      tierDone = this.tierStats[lastTier].done;
      tierTotal = this.tierStats[lastTier].total;
    } else {
      const anyTier = Object.keys(this.tierStats)[0];
      tierName = anyTier;
      tierDone = this.tierStats[anyTier].done;
      tierTotal = this.tierStats[anyTier].total;
    }

    const bar = this.createProgressBar(ratio, 20);
    const percent = (ratio * 100).toFixed(1);

    process.stdout.write('\r\x1b[K');
    process.stdout.write(
      `📁 ${tierName}: ${tierDone}/${tierTotal} | 📊 ${done}/${total}` +
      ` | ⏳ ${bar} ${percent}% | 🕒 ETA: ~${this.formatTime(etaSec)}`
    );

    this.progress.lastUpdate = now;
  }

  createProgressBar(progress, length) {
    const filled = Math.round(progress * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m:${secs.toString().padStart(2, '0')}s`;
  }

  async saveResults() {
    await fs.promises.mkdir(BASE_OUTPUT_DIR, { recursive: true });
    await fs.promises.mkdir(SCREENSHOT_DIR, { recursive: true });

    const grouped = this.results.reduce((acc, item) => {
      acc[item.tier] = acc[item.tier] || [];
      acc[item.tier].push(item);
      return acc;
    }, {});


    await fs.promises.writeFile(OUTPUT_FILE, JSON.stringify(grouped, null, 2));
    await fs.promises.writeFile(ERROR_LOG_FILE, this.errorBuffer.join('\n'));
  }
}
