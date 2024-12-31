use actix_web::{get, post, web::{self}, App, HttpServer, HttpResponse, Responder};
use actix_cors::Cors;
use countries::models::{CountriesQuery, IncorrectData};
use countries::{fetch_countries, save_countries};

#[get("/countries")]
async fn get_countries_json(countries_query: web::Query<CountriesQuery>) -> impl Responder {

    let continent = countries_query.continent.to_string();
    let max_countries = countries_query.max_countries;

    let countries_dataframe = fetch_countries::load_country_data("data/countries.csv").unwrap();
    let filtered_countries = fetch_countries::filter_country_dataframe(countries_dataframe, &continent);
    let sampled_countries = fetch_countries::sample_country_dataframe(filtered_countries, max_countries);

    web::Json(sampled_countries)
}

#[post("/incorrect")]
async fn log_incorrect(incorrect_guesses: web::Json<IncorrectData>) -> impl Responder {
    println!("Received data: {:?}", incorrect_guesses);

    match save_countries::incorrect_country_json_to_csv(incorrect_guesses.into_inner(), "data/countries_incorrect.csv") {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Guesses logged successfully"})),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()}))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(move ||
        
        {let cors = Cors::default()
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .supports_credentials()
            .max_age(3600);
        
        
        App::new()
        .wrap(cors)
        .service(get_countries_json)
        .service(log_incorrect)
        })
        
        .bind(("127.0.0.1", 8080))?
        .run()
        .await?;
    Ok(())
}