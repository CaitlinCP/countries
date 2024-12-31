
use serde::Deserialize;

#[allow(dead_code)]
#[derive(Deserialize)]
pub struct CountriesQuery {
    pub continent: String,
    pub max_countries: usize
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
pub struct Column {
    pub values: Vec<String>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
pub struct IncorrectData {
    pub columns: Vec<Column>,
}