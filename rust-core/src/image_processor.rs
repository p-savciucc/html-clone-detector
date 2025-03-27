use std::path::Path;
use image::{DynamicImage, GenericImageView};
use std::error::Error;

#[derive(Debug, Clone)]
pub struct ImageFeatures {
    pub color_histogram: Vec<f64>,
}

impl ImageFeatures {
    pub fn from_path<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn Error>> {
        let img = image::open(path)?;
        let histogram = Self::compute_color_histogram(&img);
        Ok(ImageFeatures {
            color_histogram: histogram,
        })
    }
    
    fn compute_color_histogram(img: &DynamicImage) -> Vec<f64> {
        let mut histogram = vec![0.0; 256];
        let pixel_count = img.width() as f64 * img.height() as f64;
        
        for pixel in img.pixels() {
            let gray = (pixel.2[0] as f64 * 0.299 + 
                      pixel.2[1] as f64 * 0.587 + 
                      pixel.2[2] as f64 * 0.114) as usize;
            histogram[gray.min(255)] += 1.0;
        }
        
        histogram.iter().map(|&v| v / pixel_count).collect()
    }
}