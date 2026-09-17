const SUPABASE_URL = 'https://xsadfzmjfgptipgocfso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xMYwXR9J6Jf1YrNdEn2AYQ_URVVX63I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const rawSentences = [
  "Kucing itu memakan ikan di dapur",
  "Mesin pencari mengindeks dokumen dengan cepat",
  "Sistem informasi mengolah data menjadi pengetahuan"
];

const stopwordsList = ["itu", "di", "dengan", "menjadi"];
const stemmedWordsList = {
  "memakan": "makan",
  "mengindeks": "indeks",
  "mengolah": "olah"
};

let score = 0;
let lives = 3;
let currentMode = 'idle';
let sentenceIndex = 0;
let wordList = [];
let currentWordIndex = 0;

const displayText = document.getElementById('display-text');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const btnTokenize = document.getElementById('btn-tokenize');
const btnStopword = document.getElementById('btn-stopword');
const btnStemming = document.getElementById('btn-stemming');
const btnStart = document.getElementById('btn-start');
const modal = document.getElementById('game-over-modal');
const btnSubmitScore = document.getElementById('btn-submit-score');

btnStart.addEventListener('click', startGame);
btnTokenize.addEventListener('click', () => handleAction('tokenize'));
btnStopword.addEventListener('click', () => handleAction('stopword'));
btnStemming.addEventListener('click', () => handleAction('stemming'));
btnSubmitScore.addEventListener('click', submitScore);

function startGame() {
  score = 0;
  lives = 3;
  sentenceIndex = 0;
  scoreEl.innerText = score;
  livesEl.innerText = lives;
  btnStart.disabled = true;
  nextSentence();
}

function nextSentence() {
  if (sentenceIndex >= rawSentences.length) {
    sentenceIndex = 0;
  }
  currentMode = 'tokenize';
  displayText.innerText = rawSentences[sentenceIndex];
  btnTokenize.disabled = false;
  btnStopword.disabled = true;
  btnStemming.disabled = true;
}

function handleAction(action) {
  if (currentMode === 'tokenize' && action === 'tokenize') {
    score += 10;
    wordList = rawSentences[sentenceIndex].split(" ");
    currentWordIndex = 0;
    currentMode = 'process_words';
    btnTokenize.disabled = true;
    btnStopword.disabled = false;
    btnStemming.disabled = false;
    showNextWord();
  } else if (currentMode === 'process_words') {
    const word = wordList[currentWordIndex].toLowerCase();
    const isStopword = stopwordsList.includes(word);
    const isStemmed = word in stemmedWordsList;

    if (action === 'stopword' && isStopword) {
      score += 10;
      advanceWord();
    } else if (action === 'stemming' && isStemmed) {
      score += 10;
      advanceWord();
    } else {
      lives -= 1;
      livesEl.innerText = lives;
      if (lives <= 0) endGame();
    }
  } else {
    lives -= 1;
    livesEl.innerText = lives;
    if (lives <= 0) endGame();
  }
  scoreEl.innerText = score;
}

function advanceWord() {
  currentWordIndex++;
  if (currentWordIndex < wordList.length) {
    showNextWord();
  } else {
    sentenceIndex++;
    nextSentence();
  }
}

function showNextWord() {
  const word = wordList[currentWordIndex].toLowerCase();
  const isStopword = stopwordsList.includes(word);
  const isStemmed = word in stemmedWordsList;

  if (!isStopword && !isStemmed) {
    currentWordIndex++;
    if (currentWordIndex < wordList.length) {
      showNextWord();
    } else {
      sentenceIndex++;
      nextSentence();
    }
  } else {
    displayText.innerText = wordList[currentWordIndex];
  }
}

function endGame() {
  btnStart.disabled = false;
  btnTokenize.disabled = true;
  btnStopword.disabled = true;
  btnStemming.disabled = true;
  displayText.innerText = "Permainan Selesai";
  document.getElementById('final-score').innerText = score;
  modal.style.display = 'flex';
}

async function submitScore() {
  const nameInput = document.getElementById('player-name').value.trim();
  if (!nameInput) return;

  const { error } = await supabaseClient
    .from('leaderboard')
    .insert([{ name: nameInput, score: score }]);

  if (!error) {
    modal.style.display = 'none';
    document.getElementById('player-name').value = '';
    fetchLeaderboard();
  }
}

async function fetchLeaderboard() {
  const { data, error } = await supabaseClient
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';

  if (error) {
    tbody.innerHTML = '<tr><td colspan="3">Gagal memuat data</td></tr>';
    return;
  }

  data.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td>`;
    tbody.appendChild(row);
  });
}

fetchLeaderboard();
