use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LoaderError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Missing required field: {0}")]
    MissingField(String),
}

#[derive(Debug, Deserialize, Clone)]
pub struct Document {
    pub filename: String,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub screenshot: String,
    #[serde(default)]
    pub _dom_tree: Option<String>,
}

pub type TierDocs = HashMap<String, Vec<Document>>;

pub fn load_documents(path: &str) -> Result<TierDocs, LoaderError> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let docs: TierDocs = serde_json::from_reader(reader)?;
    
    for (_tier, documents) in &docs {
        for doc in documents {
            if doc.filename.is_empty() {
                return Err(LoaderError::MissingField("filename".to_string()));
            }
        }
    }
    
    Ok(docs)
}