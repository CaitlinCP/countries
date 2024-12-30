let flashCardsData = [];
let currentCardIndex = 0;
let answerToggle = 0;
let numCorrect = 0;
let maxCountries = 5;
let previousResult = ''
let answers = []
let incorrect = {"columns": [{"name":"Country","datatype":"String","bit_settings":"","values":[]},{"name":"Capital","datatype":"String","bit_settings":"","values":[]}]};

/* Country object */
const Country = class {
    constructor(Name, Capital) {
        this.Name = Name;
        this.Capital = Capital;
        this.userGuess = '';
        this.Correct = false;
    }
}

/* Utility functions to handle data, hide elements */
function extractCountry(data, index) {
    const countryName = data[0].values[index];
    const countryCapital = data[1].values[index];

    return new Country(countryName, countryCapital);
}

function updateIncorrect(country) {
    incorrect['columns'][0].values.push(country.Name);
    incorrect['columns'][1].values.push(country.Capital);
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

function showElement(id) {
    document.getElementById(id).style.display = '';
}

/**
 * Fetch country data from the RUST API
 */
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

    resultDiv.innerHTML = '';

    if (userGuess === "") {
        resultDiv.className = 'alert alert-warning';
        resultDiv.innerHTML = `<p>Please enter a guess.</p>`;
        return;
    }

    country.userGuess = userGuess;
    normalizedAnswer = country.Capital.normalize('NFD').toLowerCase().replace(/'/g, "").trim();
    normalizedGuess = userGuess.normalize('NFD').toLowerCase().replace(/'/g, "").trim();

    console.log("Normalized Answer:", normalizedAnswer);
    console.log("Normalized Guess:", normalizedGuess);

    if (normalizedAnswer === normalizedGuess) {
        numCorrect ++;
        previousResult = `<div class="alert alert-success">Correct! You've guessed ${numCorrect}/${currentCardIndex} so far.</div>`;
        country.Correct = true;
        answers.push(country)
    }

    else {
        previousResult = `<div class="alert alert-danger">Incorrect! The capital of ${country.Name} is ${country.Capital}. 
        You've guessed ${numCorrect}/${currentCardIndex} so far.</div>`;
        answers.push(country);
        updateIncorrect(country);
    }

    displayNextFlashCard();
}

/**
 * Displays the next flash card in the quiz
 * @returns none
 */
function displayNextFlashCard() {
    const flashCardsDiv = document.getElementById("flashcards");

    // Ensure that the flashcards div is visible
    if (flashCardsDiv.style.display === 'none') {
        showElement("flashcards");
    }

    if (currentCardIndex >= flashCardsData[0].values.length) {
        

        const completionMessage = document.createElement('div');
        completionMessage.innerHTML = `${previousResult}
        Quiz complete. You guessed ${numCorrect}/${maxCountries} correctly.
        <button class="btn btn-primary btn-lg" onclick="location.reload()">Try Again</button>`;

        flashCardsDiv.appendChild(completionMessage);
        displayReportCard();
        
        console.log("Quiz complete. Results displayed.", answers);
        return;
    }

    const card = extractCountry(flashCardsData, currentCardIndex);
    flashCardsDiv.innerHTML = `<div class="flashcard">
        ${previousResult}
        <div id="guess-result"></div>
        <h2>${card.Name}</h2>
       <input type="text" id="user-guess">
        <button type="button" class="btn btn-primary btn-lg" id="make-guess">Check Answer</button>
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

function displayReportCard() {
    const flashCardsDiv = document.getElementById("flashcards");

    const reportCardDiv = document.createElement('div');
    reportCardDiv.id = 'report-card-div';
    flashCardsDiv.appendChild(reportCardDiv);

    const resultsTitle = document.createElement('h2');
    resultsTitle.textContent = 'Results:';
    reportCardDiv.appendChild(resultsTitle);

    const reportCard = document.createElement('table');
    reportCard.id = 'report-card';
    reportCardDiv.appendChild(reportCard);

    const reportCardHead = document.createElement('thead');
    reportCard.appendChild(reportCardHead);

    const headerRow = document.createElement('tr');
    reportCardHead.appendChild(headerRow);

    const headers = ['Country', 'You Guessed', 'Correct Answer', '✓'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    const reportCardBody = document.createElement('tbody');
    reportCard.appendChild(reportCardBody);

    answers.forEach((answer) => {
        const tr = document.createElement('tr');

        const tdCountry = document.createElement('td');
        tdCountry.textContent = answer.Name;
        tr.appendChild(tdCountry);

        const tdUserGuess = document.createElement('td');
        tdUserGuess.textContent = answer.userGuess;
        tr.appendChild(tdUserGuess);

        const tdCorrect = document.createElement('td');
        tdCorrect.textContent = answer.Capital;
        tr.appendChild(tdCorrect);

        const tdCheckMark = document.createElement('td');
        tdCheckMark.textContent = answer.Correct ? '✓' : '✗'; 
        tr.appendChild(tdCheckMark);

        reportCardBody.appendChild(tr);
    });
}

console.log("Script is running.");
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, fetching cards.");
    hideElement("flashcards");
});


