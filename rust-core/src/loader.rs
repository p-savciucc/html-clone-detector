use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Document {
    pub filename: String,
    pub text: String,
    pub screenshot: String,
}

pub type TierDocs = HashMap<String, Vec<Document>>;

pub fn load_documents(path: &str) -> TierDocs {
    let file = File::open(path).expect("Nu s a putut deschide fisierul");
    let reader = BufReader::new(file);
    let docs: TierDocs = serde_json::from_reader(reader).expect("Eroare la parsarea JSON");
    docs
}
