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
html-clone-detector/
├── rust-core/                    # 🦀 Codul sursă Rust (logică, clustering)
│   ├── src/
│   │   ├── main.rs
│   │   ├── analyzer.rs           # Comparare & Similaritate
│   │   └── clustering.rs         # Algoritmi de grupare
│   └── Cargo.toml                # Configurație Rust
│
├── node-renderer/               # 🌐 Microserviciu Node.js cu Puppeteer
│   ├── index.js
│   ├── package.json
│   └── renderer.js              # Logica de extragere text + screenshot
│
├── dataset/                     # 📄 Fișiere HTML de input
│   ├── simple/
│   ├── medium/
│   └── complex/
│
├── output/                      # 📤 Rezultatele grupării
│   ├── groups.json
│   └── logs/
│
├── shared/                      # 📦 Structuri comune (ex: API contracts)
│   └── schema.json              # Descrierea JSON primit de la Node
│
├── diagrams/                    # 📈 Diagrame PlantUML
│   ├── context.puml
│   └── sequence.puml
│
├── README.md                    # 📘 Descriere proiect
└── .gitignore


## 📌 Technologies Used
- Rust for high-performance logic and clustering
- Node.js + Puppeteer for headless browser rendering
- PlantUML for architecture and sequence diagrams

👨‍💻 Author
Savciuc Constantin
Email: savciuccu@gmail.com
Location: Bucharest, Romania