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
    const logEntry = `[${timestamp}] Eroare la fisierul: ${filepath} | Detalii: ${description}\n`;
    await fs.promises.appendFile(ERROR_LOG_FILE, logEntry, "utf8");
  } catch (logErr) {
    console.error("Nu am putut scrie in fisierul de eroare:", logErr);
  }
}

async function getHtmlFilesGroupedByTier(baseDir) {
  const tiers = await fs.promises.readdir(baseDir);
  const grouped = {};

  for (const tier of tiers) {
    const tierPath = path.join(baseDir, tier);
    const stats = await fs.promises.stat(tierPath);

    if (stats.isDirectory()) {
      const files = await fs.promises.readdir(tierPath);
      const htmlFiles = files
        .filter((f) => f.endsWith(".html"))
        .map((f) => path.join(tierPath, f));

      grouped[tier] = htmlFiles;
    }
  }
  return grouped;
}

async function takeScreenshotWithTimeout(page, screenshotPath, timeoutMs) {
  return Promise.race([
    page.screenshot({ path: screenshotPath, fullPage: false }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Screenshot timeout")), timeoutMs)
    ),
  ]);
}

async function processFile(page, filepath, index, total, startTime, screenshotDir) {
  const now = new Date();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  console.log(`🟢 [${index + 1}/${total}] ${filepath} | ⏱️ ${elapsed}s`);

  try {
    const absolutePath = "file://" + path.resolve(filepath);

    await page.goto(absolutePath, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const screenshotPath = path.join(
      screenshotDir,
      path.basename(filepath) + ".png"
    );

    try {
      await takeScreenshotWithTimeout(page, screenshotPath, SCREENSHOT_TIMEOUT_MS);
    } catch (screenErr) {
      console.warn(`❌ Screenshot nu a reusit pentru ${filepath}: ${screenErr.message}`);
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

async function processTier(tierName, files) {
  console.log(`🔎 Procesare tier "${tierName}" cu ${files.length} fisiere.`);
  const startTime = new Date();
  const results = new Array(files.length);

  const tierScreenshotDir = path.join(SCREENSHOT_DIR, tierName);
  if (!fs.existsSync(tierScreenshotDir)) {
    fs.mkdirSync(tierScreenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true });

  const pages = [];
  for (let i = 0; i < MAX_CONCURRENCY; i++) {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 1280, height: 720 });

    pages.push(page);
  }

  let fileIndex = 0;
  const workers = pages.map(async (page) => {
    while (true) {
      const currentIndex = fileIndex++;
      if (currentIndex >= files.length) break;

      const filepath = files[currentIndex];
      const result = await processFile(
        page,
        filepath,
        currentIndex,
        files.length,
        startTime,
        tierScreenshotDir
      );
      results[currentIndex] = result;
    }
  });

  await Promise.all(workers);

  await Promise.all(pages.map((p) => p.close()));
  await browser.close();

  const elapsedTotal = ((new Date() - startTime) / 1000).toFixed(2);
  console.log(`✅ Tier "${tierName}" procesat in ${elapsedTotal}s.`);

  return results;
}

async function processAllHTMLFilesGrouped() {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR);
    }

    const groupedFiles = await getHtmlFilesGroupedByTier(DATASET_DIR);

    const overallResults = {};

    for (const tierName in groupedFiles) {
      const files = groupedFiles[tierName];
      if (files.length === 0) {
        overallResults[tierName] = [];
        continue;
      }

      const tierResults = await processTier(tierName, files);
      overallResults[tierName] = tierResults;
    }

    await fs.promises.writeFile(
      OUTPUT_FILE,
      JSON.stringify(overallResults, null, 2),
      "utf-8"
    );

    console.log(
      `✅ Toate subdirectoarele au fost procesate. Rezultatele au fost salvate in ${OUTPUT_FILE}`
    );
  } catch (err) {
    console.error("Eroare generala:", err);
  }
}

processAllHTMLFilesGrouped();
