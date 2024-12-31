pub mod models;


pub mod fetch_countries {
    use polars::prelude::*;


pub fn load_country_data(file_path: &str) -> PolarsResult<DataFrame> {
    CsvReadOptions::default()
            .with_has_header(true)
            .try_into_reader_with_file_path(Some(file_path.into()))?
            .finish()
}

pub fn filter_country_dataframe(countries_df: DataFrame, continent: &str) -> DataFrame {
    if continent == "All" {
        countries_df
    } else {
        countries_df
            .lazy()
            .filter(col("Continent").eq(lit(continent)))
            .collect()
            .unwrap()
    }
}

pub fn sample_country_dataframe(countries_df: DataFrame, max_countries: usize) -> DataFrame{
    if max_countries >= countries_df.height() {
        countries_df
    } else {
        let max_countries_series = Series::new("max_countries", vec![max_countries as u32]);
        countries_df.sample_n(&max_countries_series, false, true, None).unwrap()
    }
}

}

pub mod save_countries {
    use polars::prelude::*;
    use super::models::IncorrectData;
    use std::fs;
    use std::path::Path;
    
    pub fn incorrect_country_json_to_csv(incorrect_data: IncorrectData, filepath: &str) -> PolarsResult<()> {
        let country_series = Series::new("Country", &incorrect_data.columns[0].values);
        let capital_series = Series::new("Capital", &incorrect_data.columns[1].values);
    
        let mut df = DataFrame::new(vec![country_series, capital_series])?;
        
        if let Some(parent) = Path::new(filepath).parent() {
            fs::create_dir_all(parent)?;
        }
        
        let mut file = std::fs::File::create(filepath)?;
        CsvWriter::new(&mut file).finish(&mut df)?;
    
        Ok(())
    }
}