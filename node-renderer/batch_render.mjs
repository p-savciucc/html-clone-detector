import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const DATASET_DIR = "../dataset";
const OUTPUT_FILE = "output_pool.json";
const SCREENSHOT_DIR = "screenshots";
const ERROR_LOG_FILE = "error_log.txt";

// Reducem concurența pentru a evita erori de timp
const MAX_CONCURRENCY = 6;
const SCREENSHOT_TIMEOUT_MS = 10000; // 10s timeout

// ---------------------------------------------------------
// 1) LOG DE ERORI
// ---------------------------------------------------------
async function logError(filepath, description) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Eroare la fișierul: ${filepath} | Detalii: ${description}\n`;
    await fs.promises.appendFile(ERROR_LOG_FILE, logEntry, "utf8");
  } catch (logErr) {
    console.error("Nu am putut scrie în fișierul de eroare:", logErr);
  }
}

// ---------------------------------------------------------
// 2) OBȚINERE FIȘIERE .HTML GRUPATE PE TIER
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 3) SCREENSHOT CU TIMEOUT (Promise.race)
// ---------------------------------------------------------
async function takeScreenshotWithTimeout(page, screenshotPath, timeoutMs) {
  return Promise.race([
    page.screenshot({ path: screenshotPath, fullPage: false }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Screenshot timeout")), timeoutMs)
    ),
  ]);
}

// ---------------------------------------------------------
// 4) PROCESAREA UNUI FIȘIER
// ---------------------------------------------------------
async function processFile(page, filepath, index, total, startTime, screenshotDir) {
  const now = new Date();
  const elapsed = ((now - startTime) / 1000).toFixed(2);
  console.log(`🟢 [${index + 1}/${total}] ${filepath} | ⏱️ ${elapsed}s`);

  try {
    const absolutePath = "file://" + path.resolve(filepath);

    // Navighează (60s timeout) și așteptăm DOM-ul
    await page.goto(absolutePath, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Construim calea pentru screenshot: ex. screenshots/tier1/nume.html.png
    const screenshotPath = path.join(
      screenshotDir,
      path.basename(filepath) + ".png"
    );

    // Facem screenshot cu timeout
    try {
      await takeScreenshotWithTimeout(page, screenshotPath, SCREENSHOT_TIMEOUT_MS);
    } catch (screenErr) {
      console.warn(`❌ Screenshot nu a reușit pentru ${filepath}: ${screenErr.message}`);
      await logError(filepath, `Screenshot error: ${screenErr.message}`);
    }

    // Extragem textul
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

// ---------------------------------------------------------
// 5) PROCESAREA TUTUROR FIȘIERELOR DINTR-UN TIER
// ---------------------------------------------------------
async function processTier(tierName, files) {
  console.log(`🔎 Procesare tier "${tierName}" cu ${files.length} fișiere.`);
  const startTime = new Date();
  const results = new Array(files.length);

  // Creează subdirector pentru tier (ex. screenshots/tier1)
  const tierScreenshotDir = path.join(SCREENSHOT_DIR, tierName);
  if (!fs.existsSync(tierScreenshotDir)) {
    fs.mkdirSync(tierScreenshotDir, { recursive: true });
  }

  // Lansăm un browser pentru acest tier
  const browser = await puppeteer.launch({ headless: true });

  // Creăm un pool de pagini, fiecare cu interceptarea resurselor inutile
  const pages = [];
  for (let i = 0; i < MAX_CONCURRENCY; i++) {
    const page = await browser.newPage();

    // Interceptăm request-urile pentru a bloca imagini, fonturi, etc. (optional)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Setăm un viewport fix pentru ca screenshotul să fie mai rapid
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

  // Așteptăm să termine toate paginile
  await Promise.all(workers);

  // Închidem resursele
  await Promise.all(pages.map((p) => p.close()));
  await browser.close();

  const elapsedTotal = ((new Date() - startTime) / 1000).toFixed(2);
  console.log(`✅ Tier "${tierName}" procesat în ${elapsedTotal}s.`);

  // Returnăm array-ul de rezultate pentru acest tier
  return results;
}

// ---------------------------------------------------------
// 6) PROCESAREA TUTUROR TIERELOR
// ---------------------------------------------------------
async function processAllHTMLFilesGrouped() {
  try {
    // Creează folderul principal de screenshots dacă nu există
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR);
    }

    // 6.1) Obține fișierele grupate pe tier
    const groupedFiles = await getHtmlFilesGroupedByTier(DATASET_DIR);

    // 6.2) Obiect în care vom stoca rezultatele
    const overallResults = {};

    // 6.3) Procesează fiecare tier pe rând
    for (const tierName in groupedFiles) {
      const files = groupedFiles[tierName];
      if (files.length === 0) {
        overallResults[tierName] = [];
        continue;
      }

      const tierResults = await processTier(tierName, files);
      overallResults[tierName] = tierResults;
    }

    // 6.4) Salvează toate rezultatele într-un JSON
    await fs.promises.writeFile(
      OUTPUT_FILE,
      JSON.stringify(overallResults, null, 2),
      "utf-8"
    );

    console.log(
      `✅ Toate subdirectoarele au fost procesate. Rezultatele au fost salvate în ${OUTPUT_FILE}`
    );
  } catch (err) {
    console.error("Eroare generală:", err);
  }
}

// Rulează scriptul
processAllHTMLFilesGrouped();
