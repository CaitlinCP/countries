use actix_web::{get, web, App, HttpServer, Responder};
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
struct CountriesQuery {
    continent: String
}

use countries::fetch_countries::{self, country_df_to_json};

#[get("/countries")]
async fn get_countries_json(countries_query: web::Query<CountriesQuery>) -> impl Responder{

    let continent = countries_query.continent.to_string();

    let countries_raw = fetch_countries::make_country_request().await.unwrap().to_string();
    let countries = fetch_countries::parse_country_data(&countries_raw);
    let countries_dataframe = fetch_countries::create_country_dataframe(countries.0, countries.1, countries.2, countries.3);
    let filtered_countries = fetch_countries::filter_country_dataframe(countries_dataframe, &continent);
    let countries_json = country_df_to_json(filtered_countries).unwrap();

    println!("{}", continent);

    web::Json(json!(countries_json))

}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(get_countries_json))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await?;
    Ok(())
}