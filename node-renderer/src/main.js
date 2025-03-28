import { scanHTMLFiles } from "./scanner.js";
import { ProcessingPool } from "./pool.js";
import { DATASET_DIR, OUTPUT_FILE } from "./constants.js";

async function main() {
  const pool = new ProcessingPool();
  const start = Date.now();

  try {
    const files = await scanHTMLFiles(DATASET_DIR);
    console.log(`🔎 Total files to process: ${files.length}\n`);

    await pool.processAll(files);
    await pool.saveResults();

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(
      `\n\n✅ Processing complete in ${duration}s. `+
      `Results saved to ${OUTPUT_FILE}\n`+
      ` - Files processed with ${pool.progress.errors} errors.`
    );
  } catch (error) {
    console.error('⛔ Critical error:', error);
    process.exit(1);
  }
}

main();
