
use countries::generate_countries::{self, show_all_countries};

fn main() {
    let countries = generate_countries::read_country_data("Europe", 5, false);

    show_all_countries(countries);
    
}