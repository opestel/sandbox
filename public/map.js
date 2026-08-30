const errorBox = document.getElementById('map-error');
const searchInput = document.getElementById('country-search');
const countryList = document.getElementById('country-list');
const toggleBorders = document.getElementById('toggle-borders');
const toggleCapitals = document.getElementById('toggle-capitals');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

const theme = getComputedStyle(document.documentElement);
const colors = {
  land: theme.getPropertyValue('--land').trim(),
  accent: theme.getPropertyValue('--accent').trim(),
  accentHover: theme.getPropertyValue('--accent-hover').trim(),
  cardBg: theme.getPropertyValue('--card-bg').trim(),
  error: theme.getPropertyValue('--error').trim(),
};

const quizPanel = document.getElementById('quiz-panel');
const quizToggle = document.getElementById('quiz-toggle');
const quizCountry = document.getElementById('quiz-country');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const quizNext = document.getElementById('quiz-next');
const quizScore = document.getElementById('quiz-score');

const map = L.map('map', {
  minZoom: 1,
  maxZoom: 8,
  maxBounds: [
    [-90, -180],
    [90, 180],
  ],
  maxBoundsViscosity: 1,
}).setView([20, 0], 2);

const borderStyle = {
  color: colors.accent,
  weight: 1,
  fillColor: colors.land,
  fillOpacity: 0.85,
};

const borderHighlightStyle = {
  color: colors.accentHover,
  weight: 2,
  fillColor: colors.land,
  fillOpacity: 1,
};

const bordersLayer = L.geoJSON(null, {
  style: borderStyle,
  onEachFeature(feature, layer) {
    layer.bindTooltip(feature.properties.name, { sticky: true });
    layer.on('mouseover', () => layer.setStyle(borderHighlightStyle));
    layer.on('mouseout', () => layer.setStyle(borderStyle));
    layer.on('click', () => map.fitBounds(layer.getBounds(), { maxZoom: 5 }));
  },
});

const capitalsLayer = L.geoJSON(null, {
  pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      weight: 1,
      color: colors.cardBg,
      fillColor: colors.error,
      fillOpacity: 0.9,
    });
  },
  onEachFeature(feature, layer) {
    const { capital, country } = feature.properties;
    layer.bindPopup(`<div class="capital-popup"><strong>${capital}</strong>Capital of ${country}</div>`);
    layer.bindTooltip(capital, {
      permanent: true,
      direction: 'top',
      offset: [0, -6],
      className: 'capital-label',
      interactive: false,
    });
  },
});

const countryLayers = new Map();

async function loadBorders() {
  const res = await fetch('/data/countries.geojson');
  if (!res.ok) {
    throw new Error('Failed to load country borders.');
  }
  const geojson = await res.json();
  bordersLayer.addData(geojson);
  bordersLayer.addTo(map);

  const fragment = document.createDocumentFragment();
  bordersLayer.eachLayer((layer) => {
    const name = layer.feature.properties.name;
    countryLayers.set(name, layer);
    const option = document.createElement('option');
    option.value = name;
    fragment.appendChild(option);
  });
  countryList.appendChild(fragment);
}

async function loadCapitals() {
  const res = await fetch('/data/capitals.geojson');
  if (!res.ok) {
    throw new Error('Failed to load capital cities.');
  }
  const geojson = await res.json();
  capitalsLayer.addData(geojson);
  capitalsLayer.addTo(map);
  initQuiz(geojson.features.map((f) => f.properties));
}

Promise.all([loadBorders(), loadCapitals()]).catch((err) => showError(err.message));

toggleBorders.addEventListener('change', () => {
  if (toggleBorders.checked) {
    bordersLayer.addTo(map);
  } else {
    map.removeLayer(bordersLayer);
  }
});

toggleCapitals.addEventListener('change', () => {
  if (toggleCapitals.checked) {
    capitalsLayer.addTo(map);
  } else {
    map.removeLayer(capitalsLayer);
  }
});

searchInput.addEventListener('change', () => {
  const layer = countryLayers.get(searchInput.value.trim());
  if (!layer) {
    return;
  }
  map.fitBounds(layer.getBounds(), { maxZoom: 5 });
  layer.setStyle(borderHighlightStyle);
  layer.openTooltip();
  setTimeout(() => layer.setStyle(borderStyle), 2000);
});

let quizPool = [];
let quizAnswer = null;
let quizScoreState = { correct: 0, total: 0 };

function loadQuizScore() {
  try {
    const saved = JSON.parse(localStorage.getItem('capitalQuizScore') || 'null');
    if (saved && Number.isInteger(saved.correct) && Number.isInteger(saved.total)) {
      quizScoreState = saved;
    }
  } catch {
    // ignore corrupt or inaccessible storage
  }
}

function saveQuizScore() {
  try {
    localStorage.setItem('capitalQuizScore', JSON.stringify(quizScoreState));
  } catch {
    // storage may be unavailable (private browsing, quota) — score just won't persist
  }
}

function updateQuizScoreDisplay() {
  quizScore.textContent = `${quizScoreState.correct} / ${quizScoreState.total}`;
}

function pickRandomDistinct(all, count, exclude) {
  const pool = all.filter((c) => c.capital !== exclude.capital);
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function nextQuizQuestion() {
  quizFeedback.hidden = true;
  quizFeedback.className = 'quiz-feedback';
  quizNext.hidden = true;

  quizAnswer = quizPool[Math.floor(Math.random() * quizPool.length)];
  quizCountry.textContent = quizAnswer.country;

  const distractors = pickRandomDistinct(quizPool, 3, quizAnswer);
  const choices = [quizAnswer, ...distractors].sort(() => Math.random() - 0.5);

  quizOptions.innerHTML = '';
  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option';
    button.textContent = choice.capital;
    button.addEventListener('click', () => answerQuizQuestion(choice, button));
    quizOptions.appendChild(button);
  });
}

function answerQuizQuestion(choice, button) {
  const buttons = [...quizOptions.querySelectorAll('.quiz-option')];
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.textContent === quizAnswer.capital) {
      b.classList.add('correct');
    }
  });

  const isCorrect = choice.capital === quizAnswer.capital;
  if (!isCorrect) {
    button.classList.add('incorrect');
  }

  quizScoreState.total += 1;
  if (isCorrect) {
    quizScoreState.correct += 1;
  }
  saveQuizScore();
  updateQuizScoreDisplay();

  quizFeedback.textContent = isCorrect
    ? 'Correct!'
    : `Not quite — ${quizAnswer.capital} is the capital of ${quizAnswer.country}.`;
  quizFeedback.className = 'quiz-feedback ' + (isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-incorrect');
  quizFeedback.hidden = false;
  quizNext.hidden = false;

  const layer = countryLayers.get(quizAnswer.country);
  if (layer) {
    map.fitBounds(layer.getBounds(), { maxZoom: 5 });
    layer.setStyle(borderHighlightStyle);
    layer.openTooltip();
    setTimeout(() => layer.setStyle(borderStyle), 2500);
  }
}

function initQuiz(capitals) {
  const countsByCountry = new Map();
  capitals.forEach((c) => countsByCountry.set(c.country, (countsByCountry.get(c.country) ?? 0) + 1));
  // Countries with more than one official capital (e.g. South Africa) have no single
  // correct answer, so they're excluded from the askable pool but still usable as distractors.
  quizPool = capitals.filter((c) => countsByCountry.get(c.country) === 1);

  loadQuizScore();
  updateQuizScoreDisplay();
  nextQuizQuestion();
}

quizNext.addEventListener('click', nextQuizQuestion);

quizToggle.addEventListener('click', () => {
  const collapsed = quizPanel.classList.toggle('collapsed');
  quizToggle.textContent = collapsed ? 'Show' : 'Hide';
  quizToggle.setAttribute('aria-expanded', String(!collapsed));
  setTimeout(() => map.invalidateSize(), 50);
});
