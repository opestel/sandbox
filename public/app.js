const form = document.getElementById('name-form');
const input = document.getElementById('name-input');
const button = form.querySelector('button');
const result = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const resultExtract = document.getElementById('result-extract');
const resultLink = document.getElementById('result-link');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) {
    return;
  }

  result.hidden = true;
  errorBox.hidden = true;
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
