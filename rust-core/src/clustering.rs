use crate::vectorizer::TextFeatures;
use crate::image_processor::ImageFeatures;
use crate::loader::Document;
use std::collections::{HashMap, HashSet};

#[derive(Debug)]
struct Cluster {
    text_centroid: Vec<f64>,
    image_centroid: Vec<f64>,
    members: HashSet<String>,
}

pub fn cluster_documents(
    docs: &[Document],
    text_features: &[TextFeatures],
    image_features: &[ImageFeatures],
    text_threshold: f64,
    image_threshold: f64,
) -> Vec<Vec<String>> {
    let feature_map: HashMap<_, _> = docs.iter()
        .enumerate()
        .map(|(i, doc)| {
            (doc.filename.clone(), (text_features[i].clone(), image_features[i].clone()))
        })
        .collect();
    
    let mut clusters: Vec<Cluster> = Vec::new();
    
    for doc in docs {
        let (text_feat, image_feat) = &feature_map[&doc.filename];
        
        let mut best_cluster = None;
        let mut best_score = 0.0;
        
        for (i, cluster) in clusters.iter().enumerate() {
            let text_sim = cosine_similarity(&text_feat.tfidf_vector, &cluster.text_centroid);
            let image_sim = histogram_similarity(&image_feat.color_histogram, &cluster.image_centroid);
            let combined_score = 0.7 * text_sim + 0.3 * image_sim;
            
            if combined_score > best_score && combined_score >= (0.7 * text_threshold + 0.3 * image_threshold) {
                best_score = combined_score;
                best_cluster = Some(i);
            }
        }
        
        match best_cluster {
            Some(i) => {
                clusters[i].members.insert(doc.filename.clone());
                update_centroid(&mut clusters[i], text_feat, image_feat);
            },
            None => {
                let mut members = HashSet::new();
                members.insert(doc.filename.clone());
                
                clusters.push(Cluster {
                    text_centroid: text_feat.tfidf_vector.clone(),
                    image_centroid: image_feat.color_histogram.clone(),
                    members,
                });
            }
        }
    }
    
    clusters.into_iter()
        .map(|c| c.members.into_iter().collect())
        .collect()
}

fn update_centroid(cluster: &mut Cluster, text_feat: &TextFeatures, image_feat: &ImageFeatures) {
    let n = cluster.members.len() as f64;
    
    for (i, val) in text_feat.tfidf_vector.iter().enumerate() {
        cluster.text_centroid[i] = (cluster.text_centroid[i] * (n - 1.0) + val) / n;
    }
    
    for (i, val) in image_feat.color_histogram.iter().enumerate() {
        cluster.image_centroid[i] = (cluster.image_centroid[i] * (n - 1.0) + val) / n;
    }
}

fn cosine_similarity(vec1: &[f64], vec2: &[f64]) -> f64 {
    let dot: f64 = vec1.iter().zip(vec2).map(|(a, b)| a * b).sum();
    let norm1: f64 = vec1.iter().map(|a| a * a).sum::<f64>().sqrt();
    let norm2: f64 = vec2.iter().map(|a| a * a).sum::<f64>().sqrt();
    
    if norm1 == 0.0 || norm2 == 0.0 {
        0.0
    } else {
        dot / (norm1 * norm2)
    }
}

fn histogram_similarity(h1: &[f64], h2: &[f64]) -> f64 {
    h1.iter().zip(h2)
        .map(|(a, b)| a.min(*b))
        .sum()
}