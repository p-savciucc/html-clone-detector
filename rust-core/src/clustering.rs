use crate::loader::Document;
use crate::vectorizer::{vectorize, cosine_similarity};

pub fn cluster_documents(docs: &[Document], vocab: &[String], threshold: f64) -> Vec<Vec<String>> {
    let vectors: Vec<Vec<f64>> = docs.iter().map(|d| vectorize(&d.text, vocab)).collect();
    let mut clusters: Vec<Vec<usize>> = Vec::new();
    
    for (i, vec) in vectors.iter().enumerate() {
        let mut assigned = false;
        for cluster in clusters.iter_mut() {
            let rep = &vectors[cluster[0]];
            if cosine_similarity(vec, rep) >= threshold {
                cluster.push(i);
                assigned = true;
                break;
            }
        }
        if !assigned {
            clusters.push(vec![i]);
        }
    }
    
    clusters.into_iter()
        .map(|cluster| cluster.into_iter().map(|i| docs[i].filename.clone()).collect())
        .collect()
}
