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
        resultDiv.textContent = 'Please enter a guess.';
        return;
    }

    country.userGuess = userGuess;
    normalizedAnswer = country.Capital.normalize('NFD').toLowerCase().replace(/'|\.|[\u0300-\u036f]/g, "").trim();
    normalizedGuess = userGuess.normalize('NFD').toLowerCase().replace(/'|\.|[\u0300-\u036f]/g, "").trim();

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
    flashCardsDiv.innerHTML = ''

    // Ensure that the flashcards div is visible
    if (flashCardsDiv.style.display === 'none') {
        showElement("flashcards");
    }

    if (currentCardIndex >= flashCardsData[0].values.length) {
        

        const completionMessage = document.createElement('div');
        completionMessage.innerHTML = `Quiz complete. You guessed ${numCorrect}/${maxCountries} correctly.
        <button class="btn btn-primary btn-lg" onclick="location.reload()">Try Again</button>`;

        flashCardsDiv.appendChild(completionMessage);
        displayReportCard();
        
        console.log("Quiz complete. Incorrect Answers:", incorrect);
        return;
    }

    const card = extractCountry(flashCardsData, currentCardIndex);

    const flashCard = document.createElement('div');
    flashCard.className = 'flashcard';
    flashCardsDiv.appendChild(flashCard);

    const guessResultDiv = document.createElement('div');
    guessResultDiv.id = 'guess-result';
    guessResultDiv.innerHTML = previousResult;
    flashCard.appendChild(guessResultDiv);

    const cardNameHeader = document.createElement('h2');
    cardNameHeader.textContent = `${card.Name}`;
    flashCard.appendChild(cardNameHeader);

    const guessInput = document.createElement('input');
    guessInput.type = 'text';
    guessInput.id = 'user-guess';
    flashCard.appendChild(guessInput);

    const checkAnswerButton = document.createElement('button');
    checkAnswerButton.className = 'btn btn-primary btn-lg';
    checkAnswerButton.id = 'make-guess';
    checkAnswerButton.textContent = 'Guess'
    flashCard.appendChild(checkAnswerButton);

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
    reportCardDiv.className = 'd-flex flex-column align-items-center justify-content-center w-100';
    flashCardsDiv.appendChild(reportCardDiv);

    const resultsTitle = document.createElement('h2');
    resultsTitle.textContent = 'Results:';
    reportCardDiv.appendChild(resultsTitle);

    const reportCard = document.createElement('table');
    reportCard.id = 'report-card';
    reportCard.className = 'table';
    reportCard.style.width = 'auto';
    reportCard.style.margin = '0 auto';
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


