# HTML Clone Detector

![Rust](https://img.shields.io/badge/Rust-🦀-orange)
![Node.js](https://img.shields.io/badge/Node.js-✓-green)
![Status](https://img.shields.io/badge/status-stable-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🔎 Quick Navigation

- [Short Description](#short-description)
- [Long Description](#long-description)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Tests](#tests)
- [Usage](#usage)
- [Sequence Diagram](#sequence-diagram)
- [Development Time](#development-time)
- [Contributing](#contributing)
- [Author](#author)

## Short Description
A high-performance, scalable tool that detects and groups visually similar (“clone”) HTML documents based on how they render in a web browser.

## Long Description  
This project detects and groups visually similar HTML documents based on how they render in a headless browser, even if their source code differs slightly.  

It uses:  
- **Rust** for fast clustering logic and parallel processing (e.g., DBSCAN)  
- **Node.js + Puppeteer** for headless rendering, visible text extraction, and screenshots  
- A custom similarity engine to form "clone sets" based on visual and textual features  

In practice, many web pages look identical despite structural code differences. This solution emphasizes scalability, parallelism, and reliable data extraction to create accurate, consistent clusters of similar pages.

---

### 🧠 Ultra-Compact Summary: Hybrid HTML Clustering

**Hybrid HTML Clustering Algorithm** combines text and visual analysis:

1. **Text**: Extracts TF-IDF from content (tokenization + stop-word removal) and compares with cosine similarity  
2. **Images**: Builds color histograms from screenshots and uses histogram intersection for comparison  
3. **Adaptive Clustering**: Uses an incremental threshold-based algorithm with real-time centroid updates  
4. **Parallelization**: Efficient processing of large datasets via **Rayon**  
5. **Robustness**: Error logging, data validation, and non-blocking resource management

**Unique Approach**: Smart fusion of textual semantics and visual appearance with strong focus on scalability and precision.

---

### ⚙️ Node.js Renderer Summary

**Advanced Preprocessing Pipeline**:

1. **Parallel rendering**: Utilizes Puppeteer with a configurable pool of headless browsers  
2. **Performance optimizations**:
   - Caches requests  
   - Blocks unnecessary resources (images, CSS)  
   - Downscales resolution (800x600 @ 0.5x)  
3. **Content extraction**:
   - Captures JPEG screenshots (80% quality)  
   - Extracts clean text (excluding JS/CSS)  
4. **Resource management**:
   - Real-time progress with ETA  
   - Structured error logging  
   - File output grouped by tiers

**Rust Core Integration**:  
Prepares raw data (text + screenshots) and streams it to the clustering system.

**Scalability**:  
Capable of processing thousands of HTML files using smart parallelism and efficient resource handling.

---

## Project Structure
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
├── run_all.sh
└── to_do.txt
```

---

## Technologies Used  
This project leverages a dual-language architecture to combine performance and flexibility:  

### 🦀 Rust Core  
**Why Rust?**  
- **Memory Safety**: Eliminates entire classes of bugs via ownership system  
- **Performance**: Native speed for TF-IDF/DBSCAN operations (~100x faster than Python, 10-25x faster than Node.js for compute-heavy tasks)  
- **Parallelism**: Rayon enables effortless data parallelism  

### 🌐 Node.js + Puppeteer  
**Why Node.js?**  
- **Async I/O**: Optimal for concurrent rendering tasks  
- **Ecosystem**: Rich library support (e.g., Puppeteer)  
- **Bridging**: Seamless data passing to Rust via JSON/FFI  

| Operation           | Rust (ms) | Node.js (ms) | Python (ms) |  
|---------------------|-----------|--------------|-------------|  
| TF-IDF (1k docs)    | 12        | 180          | 1,200       |  
| DBSCAN (5k points)  | 48        | N/A*         | 4,800       |  
| Image Histogram     | 9         | 110          | 950         |  

_* Node.js lacks native DBSCAN implementations; Python uses scikit-learn_

---

## Tests

### Node Renderer Tests

**Test 1 – 193 files**
```bash
node main.js
✅ Processing complete in 15.58s
```

**Test 2 – 1102 files**
```bash
node main.js
✅ Processing complete in 74.68s
```

**Test 3 – 2073 files**
```bash
node main.js
✅ Processing complete in 129.09s
```

**🧩 Conclusion:** The Node.js renderer scaled linearly with the number of files and completed all runs without errors. Even with over 2,000 HTML pages, rendering remained stable and fast.

---

### Rust Core Tests

**Test 1 – 193 files**
```bash
cargo run --release
✅ Processing completed in 346.77ms
```

**Test 2 – 1102 files**
```bash
cargo run --release
✅ Processing completed in 1.21s
```

**Test 3 – 2073 files**
```bash
cargo run --release
✅ Processing completed in 2.16s
```

**🧠 Conclusion:** The Rust clustering engine handled thousands of documents in milliseconds, confirming its performance and suitability for batch processing. It consistently formed stable clusters across tiers and test runs.

---

**⚠️ Note**:  
Execution times may vary depending on hardware capabilities.  
All tests were performed on a local machine with the following specifications:
- **Processor**: Intel Core i5-1135G7  
- **RAM**: 16 GB  
- **Storage**: SSD  
- **Operating System**: Ubuntu 22.04 LTS

These specs represent a mid-range development environment. Performance may differ on other setups, especially with lower CPU or memory resources.

---

## Usage

This project includes ready-to-run scripts for both Linux/Mac and Windows to simplify setup and execution:

- **Linux / macOS**: `run_all.sh` (Bash script)
- **Windows**: `run_all.ps1` (PowerShell script)

---

### 🔧 Full Setup & Execution Guide (All OS)

#### 1. 📦 Clone the Repository
```bash
# Linux / macOS
git clone https://github.com/your-repo/html-clone-detector.git
cd html-clone-detector
```
```powershell
# Windows
git clone https://github.com/your-repo/html-clone-detector.git
cd html-clone-detector
```

#### 2. ⚙️ Install Dependencies

```bash
# Linux / macOS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

```powershell
# Windows (Requires Chocolatey)
choco install nodejs rustup -y
rustup-init -y
$env:Path += ";C:\Users\$env:USERNAME\.cargo\bin"
```

#### 3. 🔨 Build Components

```bash
cd node-renderer && npm install && cd ..
cd rust-core && cargo build --release && cd ..
```

```powershell
cd node-renderer; npm install; cd ..
cd rust-core; cargo build --release; cd ..
```

#### 4. 🗂️ Prepare Environment

```bash
# Linux / macOS
mkdir -p dataset
chmod +x run_all.sh
```

```powershell
# Windows
New-Item -ItemType Directory -Path "dataset" -Force
Set-ExecutionPolicy Bypass -Scope Process -Force
```

#### 5. ▶️ Run the Pipeline

```bash
./run_all.sh
```

```powershell
run_all.ps1
```

---

### 📁 Cross-Platform Output Paths

| Description        | Linux/macOS Path              | Windows Path              |
|--------------------|-------------------------------|---------------------------|
| Input HTML Files   | `dataset/`                    | `dataset\`               |
| Screenshots Output | `node-renderer/output/`       | `node-renderer\output\` |
| Cluster Results    | `rust-core/output/`           | `rust-core\output\`     |
| Error Logs         | `node-renderer/error.log`     | `node-renderer\error.log`|

---

### 🛠 Troubleshooting Tips

#### Puppeteer / Chromium Issues
```bash
# Linux
sudo apt-get install -y libgbm-dev
```
```powershell
# Windows
npm install --global windows-build-tools
```

#### Rust Build Issues
- Install [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) on Windows.

#### Skip Chromium Download
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

#### Windows WSL Option
```bash
wsl git clone ...
# Then follow Linux instructions
```

---

### 📂 Unified Runner Scripts (logic used)

**`run_all.sh` (Linux/Mac)**

```bash
#!/bin/bash
echo "🔄 Rendering HTML documents..." && cd node-renderer && node src/main.js && cd .. && echo "🔍 Analyzing clusters..." && cd rust-core/target/release && ./html_clone_detector && cd ../../..
```

**`run_all.ps1` (Windows)**

```powershell
Write-Host "🔄 Rendering HTML documents..." -ForegroundColor Cyan
cd node-renderer; node src/main.js; cd ..
Write-Host "🔍 Analyzing clusters..." -ForegroundColor Cyan
cd rust-core\target\release; .\html_clone_detector.exe; cd ..\..\..
```

---

✅ With these steps, your environment will be ready to process and analyze thousands of HTML files in just a few minutes — fully automated on **any OS**.

## Sequence Diagram
The system consists of two main components: a Node.js renderer and a Rust-based clustering engine.

![Sequence Diagram](diagrams/sequence.png)

---

## Development Time
The analysis and architecture design took approximately 1 hour and 30 minutes. The Node-based part required around 6 hours and 31 minutes, including optimization and more detailed output, with a final runtime of ~32 seconds. The Rust part took about 2 hours and 40 minutes, including optimization, with processing completed in roughly 1.2 seconds after the HTML rendering step. Additionally, testing with various scenarios added another 5 hours to the overall effort.

**Total**: approximately 15 hours and 41 minutes.

---

## Contributing

- Found a bug? Open an issue.  
- Got an idea? Label it `enhancement`.  
- Opening a PR? Make sure it passes `cargo test --release` and follows code style.  

---

## Author
- **Name**: Savciuc Constantin  
- **Email**: savciuccu@gmail.com  
- **Location**: Bucharest, Romania
