# HTML Clone Detector

## Short Description
A high-performance, scalable tool that detects and groups visually similar (“clone”) HTML documents based on how they render in a web browser.

## Long Description
The main purpose of this project is to identify and group HTML files that appear visually identical in a headless browser, even if their underlying code differs slightly. The solution leverages:
- **Rust** for high-speed logic and clustering mechanisms (DBSCAN or similar).
- **Node.js + Puppeteer** for rendering HTML in a headless browser, extracting visible text, and capturing screenshots.
- A custom similarity analysis module that calculates and groups “clone sets” of HTML documents.

In real-world scenarios, multiple web pages may share structural or textual content but differ in small code details. This project focuses on efficiency, parallelization, and consistent data extraction to form coherent clusters of similar pages.

---

## Project Structure
```
HTML-CLONE-DETECTOR/
├── dataset/            # HTML files to be processed
├── diagrams/           # PNG diagrams for architecture and sequence
│   ├── context.png
│   └── sequence.png
├── node-renderer/      # Node.js part (with Puppeteer)
│   ├── batch_render.mjs
│   ├── package.json
│   └── package-lock.json
├── output/             # Generated results: JSON, screenshots, error logs
├── rust-core/          # Rust logic for clustering
│   ├── src/
│   │   ├── clustering.rs
│   │   ├── image_processor.rs
│   │   ├── loader.rs
│   │   ├── main.rs
│   │   └── vectorizer.rs
│   ├── Cargo.toml
│   └── Cargo.lock
├── dev_progress_log.txt
├── README.md
└── to_do.txt
```

---

## Technologies Used
- **Rust** (clustering logic, parallel processing with Rayon, image processing)
- **Node.js + Puppeteer** (headless HTML rendering, text extraction, and screenshots)
- **PlantUML** or similar tools for diagrams (see `diagrams/`)
- **npm** for dependency management in the Node.js component

---

## Results

### 1) Node Renderer

After installing dependencies and running the main script:
```bash
cd node-renderer
npm install
node batch_render.mjs
```

**Example output**:
```
🔎 Total files to process: 193 + 3
 - Process 1: Close pages.
 - Process 2: Close browser.
 - Process 3: Write output file.

(Step 3/3 complete) | 📊 196/196 | ⏳ ████████████████████] 100.0% | 🕒 ETA: ~0.0s

✅ Processing complete in 32.83s. Results saved to `../output/node-renderer/output_pool.json`
 - Files processed with 0 errors.
```

### 2) Rust Core

Compiling and running in release mode:
```bash
cd rust-core
cargo run --release
```

**Example output**:
```
📂 Found tiers: 4
⚙️  Processing tier: tier2 (22 documents)
⚙️  Processing tier: tier1 (101 documents)
⚙️  Processing tier: tier3 (40 documents)
⚙️  Processing tier: tier4 (30 documents)

🧠 Clusters found in tier1: 17
🧠 Clusters found in tier2: 9
🧠 Clusters found in tier3: 10
🧠 Clusters found in tier4: 10

✅ No documents were skipped during processing
✅ Processing completed in 1.22s
💾 Results saved to `../output/rust-core/clusters.json`
```

---

## Usage

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd HTML-CLONE-DETECTOR
   ```
2. **Install Node.js dependencies** (in the `node-renderer/` folder):
   ```bash
   cd node-renderer
   npm install
   ```
3. **Run the HTML rendering script**:
   ```bash
   node batch_render.mjs
   ```
   Outputs will be placed in `output/node-renderer/`.
4. **Compile and run the Rust component** (in the `rust-core/` folder):
   ```bash
   cd ../rust-core
   cargo run --release
   ```
   The clustering results will be stored under `output/rust-core/`.

---

## Sequence Diagram
For an overview of how HTML files are read, rendered, and then grouped, see `diagrams/sequence.png`.  
It illustrates the workflow from the user’s perspective, through the Node.js service (Puppeteer) and finally into the Rust-based clustering logic.

---

## Development Time
Example: The Node-based part took around 3 hours and 51 minutes of experimentation and optimization, with a final runtime of ~32 seconds. The Rust clustering completes in about 1.2 seconds after the HTML rendering step.

---

## Author
- **Name**: Savciuc Constantin  
- **Email**: savciuccu@gmail.com  
- **Location**: Bucharest, Romania