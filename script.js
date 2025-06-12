// Fichier: script.js (mis à jour avec sons et animations)

// --- VARIABLES D'ÉTAT DU JEU ---
let currentLanguage = 'fr';
let currentCategory = '';
let currentGameMode = 'learn'; // 'learn' ou 'quiz'
let score = 0;
let quizItems = [];
let currentQuizItem = null;
let isQuizRoundActive = false;

// --- CONSTANTES ---
const synth = window.speechSynthesis;
const gameContainer = document.getElementById('game-container');
const categoryButtonsContainer = document.getElementById('category-buttons');
const languageSwitcherContainer = document.getElementById('language-switcher');
const modeSwitcherContainer = document.getElementById('mode-switcher');
const mainTitle = document.getElementById('main-title');
const instructionText = document.getElementById('instruction-text');
const scoreContainer = document.getElementById('score-container');
const scoreSpan = document.getElementById('score');

// --- NOUVEAU : Fonction utilitaire pour jouer les sons ---
function playSound(soundFile) {
    // Crée un nouvel objet Audio avec le fichier son demandé
    const audio = new Audio(soundFile);
    // Joue le son
    audio.play();
}

// --- FONCTION DE BASE ---
function speak(item) {
    return new Promise(resolve => {
        if (synth.speaking) synth.cancel();
        const langCode = { fr: 'fr-FR', en: 'en-US', mg: 'mg-MG', th: 'th-TH' }[currentLanguage];
        const speakWithPhonetics = () => {
            const utterance = new SpeechSynthesisUtterance(item.names.mg.speech);
            utterance.lang = 'fr-FR';
            utterance.onend = resolve;
            synth.speak(utterance);
        };
        if (langCode === 'mg-MG' && item.audio && item.audio.mg) {
            const audio = new Audio(item.audio.mg);
            audio.onended = resolve;
            audio.onerror = () => {
                console.warn(`MP3 non trouvé (${item.audio.mg}). Utilisation de la voix phonétique.`);
                speakWithPhonetics();
            };
            audio.play();
        } else if (langCode === 'mg-MG') {
            speakWithPhonetics();
        } else {
            const utterance = new SpeechSynthesisUtterance(item.names[currentLanguage].speech);
            utterance.lang = langCode;
            utterance.onend = resolve;
            synth.speak(utterance);
        }
    });
}

function updateUI() {
    mainTitle.textContent = data.uiText[currentLanguage].title;
    if(currentGameMode === 'quiz') {
        instructionText.textContent = `Écoute le mot et trouve l'image !`;
        scoreContainer.classList.remove('hidden');
    } else {
        instructionText.textContent = data.uiText[currentLanguage].instruction;
        scoreContainer.classList.add('hidden');
    }
    document.querySelectorAll('.category-btn').forEach(btn => btn.textContent = data.uiText[currentLanguage].categories[btn.dataset.key]);
    if (currentCategory) { startGame(currentCategory); }
}

// --- LOGIQUE PRINCIPALE DU JEU ---
function startGame(categoryName) {
    currentCategory = categoryName;
    gameContainer.innerHTML = '';
    isQuizRoundActive = false;
    if (synth.speaking) synth.cancel();
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.key === categoryName));
    if (currentGameMode === 'learn') { startLearnMode(categoryName); } 
    else { startQuizMode(categoryName); }
}

// --- MODE APPRENTISSAGE (MODIFIÉ) ---
function startLearnMode(categoryName) {
    const items = data.items[categoryName];
    // MODIFIÉ : on récupère l'index pour décaler l'animation
    items.forEach((item, index) => {
        const card = createCard(item);
        
        // MODIFIÉ : Ajout de l'écouteur de clic
        card.addEventListener('click', async () => {
            playSound('audio/click.mp3'); // Joue le son de clic
            if (card.classList.contains('loading')) return;
            document.querySelectorAll('.card-word').forEach(p => p.textContent = '');
            card.classList.add('loading');
            const wordElement = card.querySelector('.card-word');
            wordElement.textContent = item.names[currentLanguage].display;
            await speak(item); 
            card.classList.remove('loading');
            card.classList.add('visited');
        });

        // NOUVEAU : Ajout de la classe et du délai pour l'animation
        card.style.animationDelay = `${index * 50}ms`; // Décale l'animation de chaque carte
        card.classList.add('appearing');

        gameContainer.appendChild(card);
    });
}

// --- MODE QUIZ ---
function startQuizMode(categoryName) {
    score = 0;
    updateScoreDisplay();
    quizItems = [...data.items[categoryName]];
    nextQuizRound();
}

function nextQuizRound() {
    gameContainer.innerHTML = '';
    isQuizRoundActive = true;
    if (quizItems.length === 0) {
        playSound('audio/success.mp3'); // Son de victoire de fin de catégorie
        instructionText.textContent = "Bravo, tu as terminé cette catégorie !";
        return;
    }
    instructionText.textContent = `Écoute le mot et trouve l'image !`;
    const answerIndex = Math.floor(Math.random() * quizItems.length);
    currentQuizItem = quizItems.splice(answerIndex, 1)[0];
    const distractors = data.items[currentCategory]
        .filter(item => item.names.fr.display !== currentQuizItem.names.fr.display)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    const choices = [currentQuizItem, ...distractors].sort(() => 0.5 - Math.random());
    
    // MODIFIÉ : on récupère l'index pour décaler l'animation
    choices.forEach((item, index) => {
        const card = createCard(item);
        card.addEventListener('click', () => handleQuizChoice(item, card));
        
        // NOUVEAU : Ajout de la classe et du délai pour l'animation
        card.style.animationDelay = `${index * 50}ms`; // Décale l'animation de chaque carte
        card.classList.add('appearing');

        gameContainer.appendChild(card);
    });
    setTimeout(() => speak(currentQuizItem), 500);
}

function handleQuizChoice(chosenItem, cardElement) {
    if (!isQuizRoundActive) return;
    isQuizRoundActive = false;
    const chosenWordElement = cardElement.querySelector('.card-word');
    if (chosenWordElement) {
        chosenWordElement.textContent = chosenItem.names[currentLanguage].display;
    }
    if (chosenItem.names.fr.display === currentQuizItem.names.fr.display) {
        playSound('audio/success.mp3'); // NOUVEAU : Son de réussite
        score++;
        updateScoreDisplay();
        cardElement.classList.add('correct');
        speak(chosenItem);
    } else {
        playSound('audio/error.mp3'); // NOUVEAU : Son d'échec
        cardElement.classList.add('wrong');
        const correctCard = Array.from(gameContainer.children).find(card => card.dataset.id === currentQuizItem.names.fr.display);
        if (correctCard) {
            correctCard.classList.add('correct');
            const correctWordElement = correctCard.querySelector('.card-word');
            if (correctWordElement) {
                correctWordElement.textContent = currentQuizItem.names[currentLanguage].display;
            }
        }
        speak(chosenItem);
    }
    setTimeout(nextQuizRound, 2500);
}
function updateScoreDisplay() { scoreSpan.textContent = score; }

// --- FONCTION UTILITAIRE ---
function createCard(item) {
    const card = document.createElement('div');
    card.classList.add('card'); // On retire 'appearing' d'ici pour le contrôler dynamiquement
    card.dataset.id = item.names.fr.display;
    const feedbackIcon = document.createElement('div');
    feedbackIcon.classList.add('feedback-icon');
    card.appendChild(feedbackIcon);
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.names[currentLanguage].display;
    card.appendChild(img);
    const wordText = document.createElement('p');
    wordText.classList.add('card-word');
    card.appendChild(wordText);
    return card;
}

// --- INITIALISATION DE L'INTERFACE ---
function setupControls() {
    ['fr', 'en', 'mg', 'th'].forEach(lang => {
        const button = document.createElement('button');
        button.textContent = {fr: 'Français', en: 'English', mg: 'Malagasy', th: 'ภาษาไทย'}[lang];
        button.classList.add('lang-btn');
        if (lang === currentLanguage) button.classList.add('active');
        button.addEventListener('click', () => {
            playSound('audio/click.mp3'); // MODIFIÉ : Ajout du son de clic
            currentLanguage = lang;
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateUI();
        });
        languageSwitcherContainer.appendChild(button);
    });
    [{id: 'learn', text: 'Apprentissage'}, {id: 'quiz', text: 'Quiz'}].forEach(mode => {
        const button = document.createElement('button');
        button.textContent = mode.text;
        button.classList.add('mode-btn');
        if (mode.id === currentGameMode) button.classList.add('active');
        button.addEventListener('click', () => {
            playSound('audio/click.mp3'); // MODIFIÉ : Ajout du son de clic
            currentGameMode = mode.id;
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameContainer.innerHTML = '';
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            currentCategory = '';
            updateUI();
        });
        modeSwitcherContainer.appendChild(button);
    });
    Object.keys(data.items).forEach(categoryKey => {
        const button = document.createElement('button');
        button.classList.add('category-btn');
        button.dataset.key = categoryKey;
        button.textContent = data.uiText[currentLanguage].categories[categoryKey];
        button.addEventListener('click', () => {
            playSound('audio/click.mp3'); // MODIFIÉ : Ajout du son de clic
            startGame(categoryKey);
        });
        categoryButtonsContainer.appendChild(button);
    });
}
// Lancement initial
setupControls();
updateUI();