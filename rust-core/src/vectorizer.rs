use std::collections::{HashMap, HashSet};
use crate::loader::Document;
use rayon::prelude::*;
use stop_words::{get, LANGUAGE};

#[derive(Debug, Clone)]
pub struct TextFeatures {
    pub _filename: String,
    pub tfidf_vector: Vec<f64>,
    pub _dom_tree_hash: u64,
    pub _metadata: HashMap<String, String>,
}

pub fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

pub fn build_vocabulary(docs: &[Document]) -> Vec<String> {
    let stop_words = get(LANGUAGE::English);
    let mut vocab_set: HashSet<String> = HashSet::new();
    
    let all_tokens: Vec<String> = docs.par_iter()
        .flat_map(|doc| tokenize(&doc.text))
        .collect();
    
    all_tokens.into_iter()
        .filter(|token| !stop_words.contains(token))
        .for_each(|token| {
            vocab_set.insert(token);
        });
    
    let mut vocab: Vec<String> = vocab_set.into_iter().collect();
    vocab.par_sort_unstable();
    vocab
}

impl TextFeatures {
    pub fn from_document(doc: &Document, vocab: &[String]) -> Self {
        let tokens = tokenize(&doc.text);
        let vector = Self::compute_tfidf(&tokens, vocab);
        let dom_hash = seahash::hash(doc.text.as_bytes());
        
        let mut metadata = HashMap::new();
        if let Some(title) = doc.text.lines().next() {
            metadata.insert("title".to_string(), title.to_string());
        }
        
        TextFeatures {
            _filename: doc.filename.clone(),
            tfidf_vector: vector,
            _dom_tree_hash: dom_hash,
            _metadata: metadata,
        }
    }
    
    fn compute_tfidf(tokens: &[String], vocab: &[String]) -> Vec<f64> {
        let mut freq: HashMap<&str, f64> = HashMap::new();
        let total_terms = tokens.len() as f64;
        
        for token in tokens {
            *freq.entry(token.as_str()).or_insert(0.0) += 1.0;
        }
        
        vocab.iter()
            .map(|word| freq.get(word.as_str()).unwrap_or(&0.0) / total_terms)
            .collect()
    }
}