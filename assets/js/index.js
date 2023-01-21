const darkModeIcon = document.getElementById('dark-mode-icon');
const darkModeButton = document.getElementById('dark-mode-btn');

function main() {
  darkModeButton.addEventListener('click', toggleDarkMode);

  if (isLightTheme()) {
    setLightTheme();
  }
}

function isLightTheme() {
  return localStorage.theme && localStorage.theme !== 'dark';
}

function toggleDarkMode() {
  const theme = localStorage.theme || 'dark';

  document.body.classList.add('transition-colors', 'duration-1000');

  if (theme !== 'dark') {
    setDarkTheme();
    return;
  }

  setLightTheme();
}

function setDarkTheme() {
  document.documentElement.classList.add('dark');
  darkModeIcon.classList.replace('la-sun', 'la-moon');

  localStorage.theme = 'dark';
}

function setLightTheme() {
  document.documentElement.classList.remove('dark');
  darkModeIcon.classList.replace('la-moon', 'la-sun');

  localStorage.theme = 'light';
}

window.addEventListener('DOMContentLoaded', main);
