


pub mod fetch_countries {
    use std::fs;
    use std::io::ErrorKind;
    use polars::prelude::*;
    use polars::df;

    pub enum CorrectGuess {
        Yes,
        No,
        None
    }

    impl CorrectGuess {
        pub fn as_str(&self) -> &str {
            match self {
                CorrectGuess::Yes => "Yes",
                CorrectGuess::No => "No",
                CorrectGuess::None => "None",
            }
        }
    }

    pub async fn make_country_request() -> Result<String, reqwest::Error> {
        let url: &str = "https://restcountries.com/v3.1/all";

        let body = reqwest::get(url)
            .await?
            .text()
            .await?;

        Ok(body)
    }

    pub fn parse_country_data(body: &str) -> (Vec<String>, Vec<String>, Vec<String>, Vec<String>) {

        let mut country_names: Vec<String> = Vec::new();
        let mut country_capitals: Vec<String> = Vec::new();
        let mut country_continents: Vec<String> = Vec::new();
        let mut country_correct: Vec<String> = Vec::new();

        let parsed_body: serde_json::Value = serde_json::from_str(&body).unwrap();

        for (_index, country_data) in parsed_body.as_array().unwrap().iter().enumerate() {

            let name: &str = country_data["name"]["common"].as_str().unwrap();

            let capital: Option<String> = match country_data.get("capital") {
                Some(capital_array) => capital_array.as_array()
                    .and_then(|capitals: &Vec<serde_json::Value>| capitals.get(0).and_then(|c| c.as_str()))
                    .map(|s| s.to_string()),
                None => None,

            };

            let continent: Option<String> = match country_data.get("continents") {
                Some(continent_array) => continent_array.as_array()
                    .and_then(|capitals: &Vec<serde_json::Value>| capitals.get(0).and_then(|c: &serde_json::Value| c.as_str()))
                    .map(|s: &str| s.to_string()),
            None => None,
            };

            country_names.push(String::from(name));

            if let Some(capital) = capital {
                country_capitals.push(capital);
            } else {
                country_capitals.push("None".to_string());
            }

            if let Some(continent) = continent {
                country_continents.push(continent);
            } else {
                country_continents.push("None".to_string());
            }

            let correct = CorrectGuess::None.as_str();

            country_correct.push(String::from(correct));

        }

        (country_names, country_capitals, country_continents, country_correct)
     
    }
    
    pub fn save_country_data (country_names: Vec<String>, country_capitals: Vec<String>, country_continents: Vec<String>, country_correct: Vec<String>) {
        let mut countries_df = df! {
            "Country" => country_names,
            "Capital" => country_capitals,
            "Continent" => country_continents,
            "Correct" => country_correct
        }.unwrap();

        let file_result: Result<fs::File, std::io::Error> = fs::File::create("data/countries.csv");

        let file: fs::File = match file_result {
            Ok(file) => file, 
            Err(error) => match error.kind() {
                ErrorKind::NotFound => match fs::create_dir("data") {
                    Ok(_) => fs::File::create("data/countries.csv").unwrap(),
                    Err(error) => panic!("Problem creating the directory: {:?}", error),
                },
                other_error => {
                    panic!("Problem creating the file: {:?}", other_error)
                }
            },
        };

        CsvWriter::new(file).finish(&mut countries_df).unwrap();

        }
    }

pub mod generate_countries {
    use std::{io, vec};
    use polars::{io::SerWriter, prelude::*};

    use crate::fetch_countries::CorrectGuess;

    pub struct Country {
        country: String,
        capital: String,
        correct: String,
    }

    impl Country {
        pub fn new(country: String, capital: String, correct: String) -> Self {
            Self {
                country,
                capital,
                correct,
            }
        }

        pub fn guess_capital(&mut self) -> bool {
            println!("What is the capital of {}?", self.country);
        
            let mut guess = String::new();
            io::stdin()
                .read_line(&mut guess)
                .expect("Failed to read line");
        
            let mut guess = guess.trim().to_string();
            
            if !guess.starts_with('"') && !guess.ends_with('"') {

                guess.insert(0, '"');
                guess.push('"');

            }

            println!("You guessed: {}", guess);

            let correct = self.capital.trim().eq_ignore_ascii_case(&guess);
        
            if correct {
                self.correct = String::from(CorrectGuess::Yes.as_str());
                println!("Correct!");
            } else if guess == "\"exit\"" {
                println!("Exiting. The capital of {} is {}", self.country, self.capital);
                return false;
            } else {
                self.correct = String::from(CorrectGuess::No.as_str());
                println!("Incorrect! The capital of {} is {}", self.country, self.capital);
            }
        
            true
        }

    }

    pub fn read_country_data(continent: &str, max_countries: usize, incorrect: bool) -> PolarsResult<DataFrame> {

        let countries_df = CsvReadOptions::default()
            .with_has_header(true)
            .try_into_reader_with_file_path(Some("data/countries.csv".into()))?
            .finish()?;
        
        let countries_df = if incorrect {
            countries_df
                .lazy()
                .filter(col("Correct").eq(lit("No")))
                .collect()?
        } else {
            countries_df
        };

        let filtered_df = if continent == "All" {
            countries_df.clone()
        } else {
            countries_df
                .lazy()
                .filter(col("Continent").eq(lit(continent)))
                .collect()?
        };

        if max_countries >= filtered_df.height() {
            return Ok(filtered_df);
        }

        let max_countries_series = Series::new("max_countries", vec![max_countries as u32]);

        let sampled_df = filtered_df.sample_n(&max_countries_series, false, true, None)?;

        Ok(sampled_df)

    }

    pub fn show_all_countries(countries_to_show: PolarsResult<DataFrame>) {

        let mut all_countries = {
            CsvReadOptions::default()
                .with_has_header(true)
                .try_into_reader_with_file_path(Some("data/countries.csv".into()))
                .unwrap()
                .finish()
                .unwrap()
        };

            let countries_to_show = countries_to_show.unwrap();
            let num_countries = countries_to_show.height();
            let mut num_correct = 0;
        
            for index in 0..num_countries {
                let row = countries_to_show.get_row(index).unwrap().0;
                let country_name = row.get(0).unwrap().to_string();
                let capital = row.get(1).unwrap().to_string();
                let correct = row.get(3).unwrap().to_string();
        
                let mut country = Country::new(country_name, capital, correct);
                let guess = country.guess_capital();
        
                if country.correct == CorrectGuess::Yes.as_str() {
                    num_correct += 1;
                }

                let country_name_string = country.country.trim().replace("\"", "");
                let guess_result = country.correct.trim().replace("\"", "");

                all_countries = all_countries
                    .lazy()
                    .with_column(
                        when(col("Country").eq(lit(country_name_string)))
                            .then(lit(guess_result))
                            .otherwise(col("Correct"))
                            .alias("Correct"), 
                    )
                    .collect()
                    .unwrap();

                println!("You have {} out of {} correct so far", num_correct, index + 1);
        
                if !guess {
                    break;
                }

            }
        
            let final_score: f32 = num_correct as f32 / num_countries as f32 * 100.0;
            println!("You got {} out of {} correct. Your final score is {:.2}%", num_correct, num_countries, final_score);
        
        let file = std::fs::File::create("data/countries.csv").unwrap();

        CsvWriter::new(file)
        .finish(&mut all_countries)
        .unwrap();

    }

}