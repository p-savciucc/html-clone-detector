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
(see attached screenshot `image.png`)
```
HTML-CLONE-DETECTOR/
├── dataset/
├── diagrams/
├── node-renderer/
│   ├── node_modules/
│   ├── src/
│   │   ├── constants.js
│   │   ├── main.js
│   │   ├── pool.js
│   │   └── scanner.js
│   ├── package.json
│   └── package-lock.json
├── output/
├── rust-core/
│   ├── src/
│   │   ├── clustering.rs
│   │   ├── constants.rs
│   │   ├── image_processor.rs
│   │   ├── loader.rs
│   │   ├── main.rs
│   │   └── vectorizer.rs
│   ├── Cargo.toml
│   └── Cargo.lock
├── .gitignore
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

## Tests

### Node Renderer Tests

**Test 1 – 193 files**
```bash
node main.js
🔎 Total files to process: 193
📁 tier1: 101/101 | 📊 193/193 | ⏳ 100.0%
✅ Files processed with 0 errors
✅ Processing complete in 15.58s
💾 Results saved to ../../output/node-renderer/output_pool.json
```

**Test 2 – 1102 files**
```bash
node main.js
🔎 Total files to process: 1102
📁 tier1: 101/101 | 📊 1102/1102 | ⏳ 100.0%
✅ Files processed with 0 errors
✅ Processing complete in 74.68s
💾 Results saved to ../../output/node-renderer/output_pool.json
```

**Test 3 – 2073 files**
```bash
node main.js
🔎 Total files to process: 2073
📁 tier1: 101/101 | 📊 2073/2073 | ⏳ 100.0%
✅ Files processed with 0 errors
✅ Processing complete in 129.09s
💾 Results saved to ../../output/node-renderer/output_pool.json
```

---

### Rust Core Tests

**Test 1 – 193 files**
```bash
cargo run --release
🧠 Clusters found in tier1: 17
🧠 Clusters found in tier2: 9
🧠 Clusters found in tier3: 9
🧠 Clusters found in tier4: 10
✅ No documents were skipped
✅ Processing completed in 346.77ms
💾 Results saved to ../../output/rust-core/clusters.json
```

**Test 2 – 1102 files**
```bash
cargo run --release
🧠 Clusters found in multiple tier1 copies (all 17)
✅ No documents were skipped
✅ Processing completed in 1.21s
💾 Results saved to ../../output/rust-core/clusters.json
```

**Test 3 – 2073 files**
```bash
cargo run --release
🧠 Clusters found in tier1 copies and other tiers
✅ No documents were skipped
✅ Processing completed in 2.16s
💾 Results saved to ../../output/rust-core/clusters.json
```

---

## Usage

1. **Clone the repository**:
```bash
git clone <repo-url>
cd HTML-CLONE-DETECTOR
```
2. **Install Node.js dependencies**:
```bash
cd node-renderer
npm install
```
3. **Run the HTML rendering script**:
```bash
node batch_render.mjs
```
4. **Compile and run the Rust component**:
```bash
cd ../rust-core
cargo run --release
```

---

## Sequence Diagram
See `diagrams/sequence.png` for a visual overview of the rendering and clustering workflow.

---

## Development Time
The analysis and architecture design took approximately 1 hour and 30 minutes. The Node-based part required around 6 hours and 31 minutes, including optimization and more detailed output, with a final runtime of ~32 seconds. The Rust part took about 2 hours and 40 minutes, including optimization, with processing completed in roughly 1.2 seconds after the HTML rendering step. Additionally, testing with various scenarios added another 5 hours to the overall effort.

**Total**: approximately 15 hours and 41 minutes.

---

## Author
- **Name**: Savciuc Constantin  
- **Email**: savciuccu@gmail.com  
- **Location**: Bucharest, Romania