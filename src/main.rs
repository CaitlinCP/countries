use actix_web::{get, web::{self}, App, HttpServer, Responder};
use actix_cors::Cors;
use serde::Deserialize;
use countries::fetch_countries;

#[derive(Deserialize)]
struct CountriesQuery {
    continent: String,
    max_countries: usize
}

#[get("/countries")]
async fn get_countries_json(countries_query: web::Query<CountriesQuery>) -> impl Responder {

    let continent = countries_query.continent.to_string();
    let max_countries = countries_query.max_countries;

    let countries_dataframe = fetch_countries::load_country_data("data/countries.csv").unwrap();
    let filtered_countries = fetch_countries::filter_country_dataframe(countries_dataframe, &continent);
    let sampled_countries = fetch_countries::sample_country_dataframe(filtered_countries, max_countries);

    web::Json(sampled_countries)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(move ||
        
        {let cors = Cors::default()
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_header(actix_web::http::header::CONTENT_TYPE)
            .allowed_header(actix_web::http::header::ACCEPT)
            .expose_headers(vec![
                actix_web::http::header::ACCESS_CONTROL_ALLOW_ORIGIN,
            ])
            .max_age(3600);
        
        App::new().wrap(cors).service(get_countries_json)
        })
        
        .bind(("127.0.0.1", 8080))?
        .run()
        .await?;
    Ok(())
}