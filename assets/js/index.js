// const darkModeIcon = document.getElementById('dark-mode-icon');
const darkModeButton = document.getElementById('dark-mode-btn');
const darkModeIcon = document.getElementById('dark-mode-icon');
const lightModeIcon = document.getElementById('light-mode-icon');

function main() {
  darkModeButton.addEventListener('click', toggleDarkMode);

  if (isLightTheme()) {
    setLightTheme();
  } else {
    setDarkTheme();
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

  lightModeIcon.classList.add('hidden');
  darkModeIcon.classList.remove('hidden');

  localStorage.theme = 'dark';
}

function setLightTheme() {
  document.documentElement.classList.remove('dark');

  lightModeIcon.classList.remove('hidden');
  darkModeIcon.classList.add('hidden');

  localStorage.theme = 'light';
}

window.addEventListener('DOMContentLoaded', main);
