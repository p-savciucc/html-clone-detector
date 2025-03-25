# HTML Clone Detector

A performant and scalable tool to detect and group visually similar HTML documents ("clones") based on their appearance in a web browser.

---

## 🔍 Description

The goal of this project is to identify and group HTML files that **look similar when rendered in a browser**, regardless of minor code differences.  
The system uses:

- 🦀 A **Rust** core engine for performance and clustering logic  
- 🌐 A **Node.js + Puppeteer** microservice for rendering HTML pages and extracting their visible content  
- 🧠 A custom similarity analysis and clustering mechanism to group documents into clone sets

This mirrors real-world challenges where websites may share structure, content or templates but differ slightly in code.

---

## 📁 Project Structure

```
html-clone-detector/
├── rust-core/         # 🦀 Rust core logic (clustering, analysis)
│   ├── src/
│   │   ├── main.rs
│   │   ├── analyzer.rs         # Similarity logic
│   │   └── clustering.rs       # Grouping logic
│   └── Cargo.toml              # Rust config
├── node-renderer/     # 🌐 Node.js service using Puppeteer
│   ├── index.js
│   ├── package.json
│   └── renderer.js             # Extracts visible content
├── dataset/           # 📄 HTML input files
│   ├── simple/
│   ├── medium/
│   └── complex/
├── output/            # 📤 Grouped results
│   ├── groups.json
│   └── logs/
├── shared/            # 📦 Shared schema/data contracts
│   └── schema.json
├── diagrams/          # 📈 UML diagrams
│   ├── context.puml
│   └── sequence.puml
└── README.md          # 📘 Project description
```


## 📌 Technologies Used
- Rust for high-performance logic and clustering
- Node.js + Puppeteer for headless browser rendering
- PlantUML for architecture and sequence diagrams

👨‍💻 Author
- Savciuc Constantin
- Email: savciuccu@gmail.com
- Location: Bucharest, Romania