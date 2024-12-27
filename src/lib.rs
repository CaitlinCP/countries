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
