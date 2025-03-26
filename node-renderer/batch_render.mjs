import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const DATASET_DIR = "../dataset";
const OUTPUT_FILE = "output_pool.json";
const SCREENSHOT_DIR = "screenshots";
const ERROR_LOG_FILE = "error_log.txt";

const MAX_CONCURRENCY = 12;
const SCREENSHOT_TIMEOUT_MS = 10000; // 10s timeout

async function logError(filepath, description) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Eroare la fișierul: ${filepath} | Detalii: ${description}\n`;
    await fs.promises.appendFile(ERROR_LOG_FILE, logEntry, "utf8");
  } catch (logErr) {
    console.error("Nu am putut scrie în fișierul de eroare:", logErr);
  }
}

async function getAllHtmlFiles(baseDir) {
  let allFiles = [];
  const tiers = await fs.promises.readdir(baseDir);

  for (const tier of tiers) {
    const tierPath = path.join(baseDir, tier);
    const stats = await fs.promises.stat(tierPath);
    if (stats.isDirectory()) {
      const files = await fs.promises.readdir(tierPath);
      for (const file of files) {
        if (file.endsWith(".html")) {
          const fullPath = path.join(tierPath, file);
          allFiles.push(fullPath);
        }
      }
    }
  }

  return allFiles;
}

async function takeScreenshotWithTimeout(page, screenshotPath, timeoutMs) {
  return Promise.race([
    page.screenshot({ path: screenshotPath }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Screenshot timeout")), timeoutMs)
    ),
  ]);
}

async function processFile(page, filepath, index, total, startTime) {
  const now = new Date();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  console.log(`🟢 [${index + 1}/${total}] ${filepath} | ⏱️ ${elapsed}s`);

  try {
    const absolutePath = "file://" + path.resolve(filepath);
    await page.goto(absolutePath, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, path.basename(filepath) + ".png");
    try {
      await takeScreenshotWithTimeout(page, screenshotPath, SCREENSHOT_TIMEOUT_MS);
    } catch (screenErr) {
      console.warn(`❌ Screenshot nu a reușit pentru ${filepath}: ${screenErr.message}`);
      await logError(filepath, `Screenshot error: ${screenErr.message}`);
    }

    const textContent = await page.evaluate(() => document.body.innerText);

    return {
      filename: path.basename(filepath),
      text: textContent,
      screenshot: screenshotPath,
    };
  } catch (err) {
    console.error(`❌ Eroare la: ${filepath} => ${err.message}`);
    await logError(filepath, err.message);

    return { filename: path.basename(filepath), error: err.message };
  }
}

async function processAllHTMLFiles(baseDir) {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR);
    }

    const allFiles = await getAllHtmlFiles(baseDir);
    console.log(`🔎 Total fișiere de procesat: ${allFiles.length}`);

    const startTime = new Date();

    const browser = await puppeteer.launch({ headless: true });

    const pages = [];
    for (let i = 0; i < MAX_CONCURRENCY; i++) {
      const page = await browser.newPage();
      pages.push(page);
    }

    const results = new Array(allFiles.length);
    let fileIndex = 0;

    const workers = pages.map(async (page) => {
      while (true) {
        const currentIndex = fileIndex++;
        if (currentIndex >= allFiles.length) break;

        const filepath = allFiles[currentIndex];
        const result = await processFile(page, filepath, currentIndex, allFiles.length, startTime);
        results[currentIndex] = result;
      }
    });

    await Promise.all(workers);

    await Promise.all(pages.map((p) => p.close()));
    await browser.close();

    await fs.promises.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");

    const totalTime = ((new Date() - startTime) / 1000).toFixed(2);
    console.log(`✅ Procesare completă în ${totalTime}s. Rezultatele au fost salvate în ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("Eroare generală:", err);
  }
}

processAllHTMLFiles(DATASET_DIR);
