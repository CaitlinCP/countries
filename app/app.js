let flashCardsData = [];
let currentCardIndex = 0;
let answerToggle = 0;
let numCorrect = 0;
let maxCountries = 5;
let previousResult = '';

/* Country object */
const Country = class {
    constructor(Name, Capital) {
        this.Name = Name;
        this.Capital = Capital;
    }
}

/* Utility functions to handle data, hide elements */
function extractCountry(data, index) {
    const countryName = data[0].values[index];
    const countryCapital = data[1].values[index];

    return new Country(countryName, countryCapital);
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

function showElement(id) {
    document.getElementById(id).style.display = '';
}

/* Fetch country data from the Rust API */
async function fetchFlashCards() {    
    continent = document.getElementById("continentSelect").value
    maxCountries = document.getElementById("numberOfCards").value

    try {
        const response = await fetch(`http://127.0.0.1:8080/countries?continent=${continent}&max_countries=${maxCountries}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        flashCardsData = data.columns;

        hideElement("quiz-settings");

        maxCountries = flashCardsData[0].values.length;
        previousResult = `<div class="alert alert-secondary">${numCorrect}/${maxCountries} guessed so far.</div>`

        console.log("Data fetched, displaying first card.");

        displayNextFlashCard();
    } catch (error) {
        console.error("Error fetching flashcards:", error);
    }

}

/**
 * Checks the user's input and compares it against the country data presented.
 * @param {*} country 
 * @returns none
 */
function checkAnswer(country) {
    const inputElement = document.getElementById("user-guess");
    const userGuess = inputElement.value;
    const resultDiv = document.getElementById("guess-result");

    if (userGuess === "") {
        resultDiv.className = 'alert alert-warning';
        resultDiv.innerHTML = `<p>Please enter a guess.</p>`;
        return;
    }

    normalizedAnswer = country.Capital.normalize('NFD').toLowerCase().replace(/'/g, "").trim();
    normalizedGuess = userGuess.normalize('NFD').toLowerCase().replace(/'/g, "").trim();

    console.log("Normalized Answer:", normalizedAnswer);
    console.log("Normalized Guess:", normalizedGuess);

    if (normalizedAnswer == normalizedGuess) {
        numCorrect ++;
        previousResult = `<div class="alert alert-success">Correct! You've guessed ${numCorrect}/${maxCountries} so far.</div>`;
    }

    else {
        previousResult = `<div class="alert alert-danger">Incorrect! The capital of ${country.Name} is ${country.Capital}. 
        You've guessed ${numCorrect}/${maxCountries} so far.</div>`;
    }

    displayNextFlashCard();
}

/**
 * Displays the next flash card in the quiz
 * @returns none
 */
function displayNextFlashCard() {
    if (document.getElementById("flashcards").style.display = 'none') {
        showElement("flashcards")
    }

    const flashCardsDiv = document.getElementById("flashcards");
    console.log("Attempting to display card:", currentCardIndex);

    if (currentCardIndex >= flashCardsData[0].values.length) {
        flashCardsDiv.innerHTML = `${previousResult}
        Quiz complete. You guessed ${numCorrect}/${maxCountries} correctly.
        <button class="btn btn-primary" onClick=location.reload()>Try Again</button>`;
        return;
    }

    const card = extractCountry(flashCardsData, currentCardIndex);
    flashCardsDiv.innerHTML = `<div class="flashcard">
        ${previousResult}
        <div id="guess-result"></div>
        <h2>${card.Name}</h2>
       <input type="text" id="user-guess">
        <button type="button" class="btn btn-primary" id="make-guess">Check Answer</button>
    </div>`;
    document.getElementById("user-guess").focus();
    document.getElementById("make-guess").addEventListener('click', () => checkAnswer(card));
    document.getElementById("user-guess").addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            checkAnswer(card);
        }
    });

    currentCardIndex++;
}

console.log("Script is running.")
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, fetching cards.");
    hideElement("flashcards");

});