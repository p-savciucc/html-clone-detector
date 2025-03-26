use std::collections::{HashMap, HashSet};
use crate::loader::Document;

pub fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

pub fn build_vocabulary(docs: &[Document]) -> Vec<String> {
    let mut vocab_set: HashSet<String> = HashSet::new();
    for doc in docs {
        for token in tokenize(&doc.text) {
            vocab_set.insert(token);
        }
    }
    let mut vocab: Vec<String> = vocab_set.into_iter().collect();
    vocab.sort();
    vocab
}

pub fn vectorize(text: &str, vocab: &[String]) -> Vec<f64> {
    let tokens = tokenize(text);
    let mut freq: HashMap<&str, f64> = HashMap::new();
    for token in tokens.iter() {
        *freq.entry(token.as_str()).or_insert(0.0) += 1.0;
    }
    vocab.iter().map(|word| *freq.get(word.as_str()).unwrap_or(&0.0)).collect()
}

pub fn cosine_similarity(vec1: &[f64], vec2: &[f64]) -> f64 {
    let dot: f64 = vec1.iter().zip(vec2).map(|(a, b)| a * b).sum();
    let norm1: f64 = vec1.iter().map(|a| a * a).sum::<f64>().sqrt();
    let norm2: f64 = vec2.iter().map(|a| a * a).sum::<f64>().sqrt();
    if norm1 == 0.0 || norm2 == 0.0 {
        0.0
    } else {
        dot / (norm1 * norm2)
    }
}
