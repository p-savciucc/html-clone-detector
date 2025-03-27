import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const BASE_OUTPUT_DIR = "../output/node-renderer";
const OUTPUT_FILE = path.join(BASE_OUTPUT_DIR, "output_pool.json");
const SCREENSHOT_DIR = path.join(BASE_OUTPUT_DIR, "screenshots");
const ERROR_LOG_FILE = path.join(BASE_OUTPUT_DIR, "error_log.txt");
const DATASET_DIR = "../dataset";

const MAX_CONCURRENCY = 8;
const SCREENSHOT_TIMEOUT_MS = 10000;

if (!fs.existsSync(BASE_OUTPUT_DIR)) {
  fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
}

let errorCount = 0;

async function logError(filepath, description) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Error in file: ${filepath} | Details: ${description}\n`;
    await fs.promises.appendFile(ERROR_LOG_FILE, logEntry, "utf8");
    errorCount++;
  } catch (logErr) {
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
      const htmlFiles = files.filter(file => file.endsWith(".html"));
      for (let i = 0; i < htmlFiles.length; i++) {
        allFiles.push({
          filepath: path.join(tierPath, htmlFiles[i]),
          tier,
          tierIndex: i + 1,
          tierTotal: htmlFiles.length
        });
      }
    }
  }
  return allFiles;
}

async function takeScreenshotWithTimeout(page, screenshotPath, timeoutMs) {
  return Promise.race([
    page.screenshot({ path: screenshotPath, fullPage: false }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Screenshot timeout")), timeoutMs)
    ),
  ]);
}

function formatTime(secNum) {
  if (secNum < 60) return `${secNum.toFixed(1)}s`;
  const m = Math.floor(secNum / 60);
  const s = (secNum % 60).toFixed(0).padStart(2, "0");
  return `${m}m:${s}s`;
}

function updateProgressBarWithETA(current, total, startTime, extraInfo = "") {
  const ratio = current / total;
  const percent = (ratio * 100).toFixed(1) + "%";

  const barLength = 20;
  const filledLength = Math.round(barLength * ratio);
  const bar = "█".repeat(filledLength) + "-".repeat(barLength - filledLength);

  const now = Date.now();
  const elapsedSec = (now - startTime) / 1000;
  const speed = current / elapsedSec;
  const etaSec = speed > 0 ? (total - current) / speed : 0;
  const etaStr = formatTime(etaSec);

  const output = `${extraInfo} | 📊 ${current}/${total} | ⏳ ${bar}] ${percent} | 🕒 ETA: ~${etaStr}`;
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(output);
  if (current === total) {
    process.stdout.write("\n");
  }
}

async function processFile(page, fileObj) {
  const { filepath, tier, tierIndex, tierTotal } = fileObj;
  try {
    const absolutePath = "file://" + path.resolve(filepath);
    await page.goto(absolutePath, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const tierScreenshotDir = path.join(SCREENSHOT_DIR, tier);
    if (!fs.existsSync(tierScreenshotDir)) {
      fs.mkdirSync(tierScreenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(tierScreenshotDir, path.basename(filepath) + ".png");

    try {
      await takeScreenshotWithTimeout(page, screenshotPath, SCREENSHOT_TIMEOUT_MS);
    } catch (screenErr) {
      await logError(filepath, `Screenshot error: ${screenErr.message}`);
    }

    const textContent = await page.evaluate(() => document.body.innerText);

    return {
      filename: path.basename(filepath),
      text: textContent,
      screenshot: screenshotPath,
      tier,
      tierIndex,
      tierTotal
    };
  } catch (err) {
    await logError(filepath, err.message);
    return { filename: path.basename(filepath), error: err.message, tier, tierIndex, tierTotal };
  }
}

async function processAllHTMLFiles(baseDir) {
  try {
    const allFiles = await getAllHtmlFiles(baseDir);
    console.log(`🔎 Total files to process: ${allFiles.length} + 3`);
    console.log(` - Process 1: Close pages.`);
    console.log(` - Process 2: Close browser.`);
    console.log(` - Process 3: Write output file.\n`);
    const totalFiles = allFiles.length;
    const finalSteps = 3;
    const totalWork = totalFiles + finalSteps;
    const startTime = Date.now();
    let overallCompleted = 0;

    const browser = await puppeteer.launch({ headless: true });
    const pages = [];
    for (let i = 0; i < MAX_CONCURRENCY; i++) {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      await page.setViewport({ width: 1280, height: 720 });
      pages.push(page);
    }

    const results = new Array(totalFiles);
    let fileIndex = 0;

    const workers = pages.map(async (page) => {
      while (true) {
        const idx = fileIndex++;
        if (idx >= totalFiles) break;
        const fileObj = allFiles[idx];
        const result = await processFile(page, fileObj);
        results[idx] = result;
        overallCompleted++;
        const extraInfo = `📁 ${fileObj.tier}: ${fileObj.tierIndex}/${fileObj.tierTotal}`;
        updateProgressBarWithETA(overallCompleted, totalWork, startTime, extraInfo);
      }
    });
    await Promise.all(workers);

    if (overallCompleted < totalFiles) {
      overallCompleted = totalFiles;
      updateProgressBarWithETA(overallCompleted, totalWork, startTime, "(All files processed)");
    }

    await Promise.all(pages.map(p => p.close()));
    overallCompleted++;
    updateProgressBarWithETA(overallCompleted, totalWork, startTime, "(Step 1/3 complete)");

    await browser.close();
    overallCompleted++;
    updateProgressBarWithETA(overallCompleted, totalWork, startTime, "(Step 2/3 complete)");

    const groupedResults = {};
    for (const res of results) {
      const tier = res.tier || "unknown";
      if (!groupedResults[tier]) {
        groupedResults[tier] = [];
      }
      groupedResults[tier].push(res);
    }
    await fs.promises.writeFile(OUTPUT_FILE, JSON.stringify(groupedResults, null, 2), "utf-8");
    overallCompleted++;
    updateProgressBarWithETA(overallCompleted, totalWork, startTime, "(Step 3/3 complete)");

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n✅ Processing complete in ' + totalTime + 's. Results saved to `' + OUTPUT_FILE + '`\n');
    console.log(` - Files processed with ${errorCount} errors.`);
    process.exit(0);
  } catch (err) {
    await logError("General", err.message);
    process.exit(1);
  }
}

processAllHTMLFiles(DATASET_DIR);
