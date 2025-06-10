// --- MODIFIEZ ET AJOUTEZ VOS MOTS ET IMAGES ICI ---
const data = {
    // Les traductions des textes de l'interface
    uiText: {
        fr: {
            title: "Le Jeu des Mots Parlants",
            instruction: "Choisis une catégorie pour commencer !",
            categories: {
                "Fruits": "Fruits",
                "Animaux": "Animaux",
                "Verbes d'action": "Verbes d'action"
            }
        },
        en: {
            title: "The Talking Words Game",
            instruction: "Choose a category to begin!",
            categories: {
                "Fruits": "Fruits",
                "Animaux": "Animals",
                "Verbes d'action": "Action Verbs"
            }
        },
        mg: { // Section pour la langue Malgache
            title: "Lalao Fiteny Miteny",
            instruction: "Mifidiana sokajy hanombohana!",
            categories: {
                "Fruits": "Voankazo",
                "Animaux": "Biby",
                "Verbes d'action": "Matoanteny"
            }
        }
    },
    // Notre dictionnaire de mots
    items: {
        "Fruits": [
            { names: { fr: "Pomme", en: "Apple", mg: "Paoma" }, image: "images/pomme.png" },
            { names: { fr: "Banane", en: "Banana", mg: "Akondro" }, image: "images/banane.png" },
            { names: { fr: "Fraise", en: "Strawberry", mg: "Frezy" }, image: "images/fraise.png" }
        ],
        "Animaux": [
            { names: { fr: "Chat", en: "Cat", mg: "Saka" }, image: "images/chat.png" },
            { names: { fr: "Chien", en: "Dog", mg: "Alika" }, image: "images/chien.png" },
            { names: { fr: "Lion", en: "Lion", mg: "Liona" }, image: "images/lion.png" }
        ],
        "Verbes d'action": [
            { names: { fr: "Manger", en: "Manger", mg: "Mihinana" }, image: "images/manger.png" },
            { names: { fr: "Boire", en: "Boire", mg: "Misotro" }, image: "images/boire.png" },
            { names: { fr: "Courir", en: "Courir", mg: "Mihazakazaka" }, image: "images/courir.png" }
        ]
    }
};
// --------------------------------------------------------

let currentLanguage = 'fr';
let currentCategory = '';

const gameContainer = document.getElementById('game-container');
const categoryButtonsContainer = document.getElementById('category-buttons');
const languageSwitcherContainer = document.getElementById('language-switcher');
const mainTitle = document.getElementById('main-title');
const instructionText = document.getElementById('instruction-text');

function speak(text, langCode) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function displayCategory(categoryName) {
    currentCategory = categoryName;
    gameContainer.innerHTML = '';
    const items = data.items[categoryName];

    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.names[currentLanguage];
        card.appendChild(img);
        gameContainer.appendChild(card);

        card.addEventListener('click', () => {
            const textToSpeak = item.names[currentLanguage];
            let langCode;
            switch (currentLanguage) {
                case 'fr':
                    langCode = 'fr-FR';
                    break;
                case 'en':
                    langCode = 'en-US';
                    break;
                case 'mg':
                    langCode = 'mg-MG'; // Code pour le malgache
                    break;
                default:
                    langCode = 'fr-FR';
            }
            speak(textToSpeak, langCode);
        });
    });
}

function updateUI() {
    mainTitle.textContent = data.uiText[currentLanguage].title;
    instructionText.textContent = data.uiText[currentLanguage].instruction;
    document.querySelectorAll('.category-btn').forEach(button => {
        const categoryKey = button.dataset.key;
        button.textContent = data.uiText[currentLanguage].categories[categoryKey];
    });
    if (currentCategory) {
        displayCategory(currentCategory);
    }
}

// --- Initialisation du jeu ---

// Création des boutons de langue (maintenant avec 'mg')
['fr', 'en', 'mg'].forEach(lang => {
    const button = document.createElement('button');
    let buttonText;
    if (lang === 'fr') buttonText = 'Français';
    else if (lang === 'en') buttonText = 'English';
    else if (lang === 'mg') buttonText = 'Malagasy';
    
    button.textContent = buttonText;
    button.classList.add('lang-btn');
    button.dataset.lang = lang;
    if (lang === currentLanguage) {
        button.classList.add('active');
    }
    button.addEventListener('click', () => {
        currentLanguage = lang;
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateUI();
    });
    languageSwitcherContainer.appendChild(button);
});

// Création des boutons de catégorie (pas de changement ici)
Object.keys(data.items).forEach(categoryKey => {
    const button = document.createElement('button');
    button.classList.add('category-btn');
    button.dataset.key = categoryKey;
    button.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        displayCategory(categoryKey);
    });
    categoryButtonsContainer.appendChild(button);
});

// Affiche l'interface initiale
updateUI();