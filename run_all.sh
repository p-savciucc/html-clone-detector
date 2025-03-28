#!/bin/bash

# run_all.sh - Automated pipeline for HTML Clone Detector

# -------------------------------
# 1. Validate environment
# -------------------------------
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v16+"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Rust not found. Please install Rust toolchain"
    exit 1
fi

# -------------------------------
# 2. Run Node.js renderer
# -------------------------------
echo "🚀 Starting Node.js rendering phase..."
cd node-renderer/src || { echo "❌ node-renderer/src not found"; exit 1; }

START_NODE=$(date +%s)
node main.js
NODE_EXIT_CODE=$?
END_NODE=$(date +%s)

if [ $NODE_EXIT_CODE -ne 0 ]; then
    echo "❌ Node.js renderer failed with code $NODE_EXIT_CODE"
    exit 1
fi

echo ""
# echo "✅ Node.js rendering completed in $((END_NODE-START_NODE)) seconds"

# -------------------------------
# 3. Run Rust clustering
# -------------------------------
echo "🦀 Starting Rust clustering phase..."
cd ../../rust-core/src || { echo "❌ rust-core directory not found"; exit 1; }

START_RUST=$(date +%s)
cargo run --release
RUST_EXIT_CODE=$?
END_RUST=$(date +%s)

if [ $RUST_EXIT_CODE -ne 0 ]; then
    echo "❌ Rust clustering failed with code $RUST_EXIT_CODE"
    exit 1
fi

# echo "✅ Rust clustering completed in $((END_RUST-START_RUST)) seconds"

# -------------------------------
# 4. Final output
# -------------------------------
TOTAL_TIME=$((END_RUST-START_NODE))
echo ""
echo "🎉 Total processing time: $TOTAL_TIME seconds"
echo "📊 Results available in:"
echo "   - node-renderer/output/ (rendered data)"
echo "   - rust-core/output/ (cluster analysis)"