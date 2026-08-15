const form = document.getElementById('name-form');
const input = document.getElementById('name-input');
const button = form.querySelector('button');
const result = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const resultExtract = document.getElementById('result-extract');
const resultLink = document.getElementById('result-link');
const errorBox = document.getElementById('error');
const langSelect = document.getElementById('lang-select');
const translateButton = document.getElementById('translate-button');
const translatedExtract = document.getElementById('translated-extract');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) {
    return;
  }

  result.hidden = true;
  errorBox.hidden = true;
  translatedExtract.hidden = true;
  translatedExtract.textContent = '';
  button.disabled = true;
  button.textContent = 'Searching…';

  try {
    const res = await fetch(`/api/origin?name=${encodeURIComponent(name)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? 'Something went wrong.');
    }
    if (!data) {
      throw new Error(`No origin found for "${name}".`);
    }

    resultTitle.textContent = data.title;
    resultExtract.textContent = data.extract;
    resultLink.href = data.url;
    result.hidden = false;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Find origin';
  }
});

translateButton.addEventListener('click', async () => {
  const text = resultExtract.textContent;
  const targetLang = langSelect.value;
  if (!text) {
    return;
  }

  errorBox.hidden = true;
  translatedExtract.hidden = true;
  translateButton.disabled = true;
  translateButton.textContent = 'Translating…';

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? 'Translation failed.');
    }

    translatedExtract.textContent = data.translatedText;
    translatedExtract.hidden = false;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  } finally {
    translateButton.disabled = false;
    translateButton.textContent = 'Translate';
  }
});
