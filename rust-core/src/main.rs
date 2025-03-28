mod loader;
mod vectorizer;
mod clustering;
mod image_processor;
mod constants;

use constants::{INPUT_FILE, OUTPUT_FILE, ERROR_LOG_FILE, TEXT_SIM_THRESHOLD, IMAGE_SIM_THRESHOLD};

use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fs::{self, File},
    io::Write,
    sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}},
    time::{Instant, SystemTime},
};
use rayon::prelude::*;
use serde_json::json;

use loader::load_documents;
use vectorizer::{build_vocabulary, TextFeatures};
use clustering::cluster_documents;
use image_processor::ImageFeatures;

fn format_timestamp(time: SystemTime) -> String {
    humantime::format_rfc3339_millis(time).to_string()
}

fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let start_time = Instant::now();
    
    fs::create_dir_all(constants::OUTPUT_DIR)?;
    
    let tier_docs = load_documents(INPUT_FILE)?;
    println!("📂 Found tiers: {}", tier_docs.len());
    
    let mut overall_clusters = HashMap::new();

    let text_sim_threshold = TEXT_SIM_THRESHOLD;
    let image_sim_threshold = IMAGE_SIM_THRESHOLD;
    
    let is_printed = AtomicBool::new(false);
    let skipped_docs = Arc::new(Mutex::new(HashSet::new()));

    let results: Vec<_> = tier_docs
        .into_par_iter()
        .map(|(tier, docs)| {
            println!("⚙️  Processing tier: {} ({} documents)", tier, docs.len());
            
            let vocab = build_vocabulary(&docs);
            
            let mut valid_docs = Vec::new();
            let mut valid_text_features = Vec::new();
            let mut valid_image_features = Vec::new();
            
            for doc in docs {
                match ImageFeatures::from_path(&doc.screenshot) {
                    Ok(image_features) => {
                        valid_text_features.push(TextFeatures::from_document(&doc, &vocab));
                        valid_docs.push(doc);
                        valid_image_features.push(image_features);
                    }
                    Err(e) => {
                        let timestamp = format_timestamp(SystemTime::now());
                        let error_entry = format!(
                            "[{}] Error in file: {} | Details: {}",
                            timestamp,
                            doc.filename,
                            e
                        );
                        let mut skipped = skipped_docs.lock().unwrap();
                        skipped.insert(error_entry);
                    }
                }
            }
            
            let clusters = if !valid_docs.is_empty() {
                cluster_documents(
                    &valid_docs, 
                    &valid_text_features, 
                    &valid_image_features, 
                    text_sim_threshold, 
                    image_sim_threshold
                )
            } else {
                Vec::new()
            };

            if !is_printed.swap(true, Ordering::Relaxed) {
                println!();
            }

            println!("🧠 Clusters found in {}: {}", tier, clusters.len());
            Ok((tier, clusters))
        })
        .collect::<Result<Vec<_>, Box<dyn Error + Send + Sync>>>()?;
    
    for (tier, clusters) in results {
        overall_clusters.insert(tier, json!(clusters));
    }
    
    fs::write(OUTPUT_FILE, serde_json::to_string_pretty(&overall_clusters)?)?;

    let skipped = skipped_docs.lock().unwrap();
    if !skipped.is_empty() {
        let mut file = File::create(ERROR_LOG_FILE)?;
        for error_entry in skipped.iter() {
            writeln!(file, "{}", error_entry)?;
        }
        
        println!("\n⚠️  Skipped {} documents. Details saved to: `{}`", 
            skipped.len(), ERROR_LOG_FILE);
    } else {
        println!("\n✅ No documents were skipped during processing");
    }

    println!();
    println!("✅ Processing completed in {:.2?}", start_time.elapsed());
    println!("💾 Results saved to `{}`", OUTPUT_FILE);

    Ok(())
}
