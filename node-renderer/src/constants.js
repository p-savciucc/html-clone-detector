import path from "path";

export const BASE_OUTPUT_DIR = "../../output/node-renderer";
export const OUTPUT_FILE = path.join(BASE_OUTPUT_DIR, "output_pool.json");
export const SCREENSHOT_DIR = path.join(BASE_OUTPUT_DIR, "screenshots");
export const ERROR_LOG_FILE = path.join(BASE_OUTPUT_DIR, "error_log.txt");
export const DATASET_DIR = "../../dataset";

export const MAX_CONCURRENCY = 8;
export const SCREENSHOT_TIMEOUT_MS = 5000;
export const PAGE_TIMEOUT = 15000;
export const PROGRESS_UPDATE_INTERVAL = 250;
export const TEXT_TRUNCATE = 25000;
