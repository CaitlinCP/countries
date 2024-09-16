
use countries::fetch_countries;

#[tokio::main]
async fn main() {

    let body: String = fetch_countries::make_country_request().await.unwrap();
    let countries: (Vec<String>, Vec<String>, Vec<String>, Vec<String>) = fetch_countries::parse_country_data(&body);
    
    let country_names: Vec<String> = countries.0;
    let country_capitals: Vec<String> = countries.1;
    let country_continents: Vec<String> = countries.2;
    let country_correct: Vec<String> = countries.3;

    fetch_countries::save_country_data(country_names, country_capitals, country_continents, country_correct);
}