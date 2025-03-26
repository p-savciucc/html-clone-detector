mod loader;
mod vectorizer;
mod clustering;

use std::collections::HashMap;
use std::fs;
use loader::{load_documents, TierDocs};
use vectorizer::build_vocabulary;
use clustering::cluster_documents;

fn main() {
    let tier_docs: TierDocs = load_documents("../node-renderer/output_pool.json");
    println!("Tiere gasite: {}", tier_docs.len());
    
    let mut overall_clusters: HashMap<String, Vec<Vec<String>>> = HashMap::new();
    let threshold = 0.8;
    
    for (tier, docs) in tier_docs {
        println!("Procesare tier: {} ({} documente)", tier, docs.len());
        let vocab = build_vocabulary(&docs);
        println!("Dimensiunea vocabularului in {}: {}", tier, vocab.len());
        
        let clusters = cluster_documents(&docs, &vocab, threshold);
        println!("Numar de clustere in {}: {}", tier, clusters.len());
        
        overall_clusters.insert(tier, clusters);
    }
    
    let output = serde_json::to_string_pretty(&overall_clusters).expect("Eroare la serializare");
    println!("Output final:\n{}", output);
    fs::write("clusters.json", output).expect("Eroare la scrierea fisierului de output");
}
