function main() {
  document.getElementById('dark-mode-btn').addEventListener('click', toggleDarkMode);

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
  const icon = document.getElementById('dark-mode-icon');

  document.documentElement.classList.add('dark');
  icon.classList.replace('la-sun', 'la-moon');

  localStorage.theme = 'dark';
}

function setLightTheme() {
  const icon = document.getElementById('dark-mode-icon');

  document.documentElement.classList.remove('dark');
  icon.classList.replace('la-moon', 'la-sun');

  localStorage.theme = 'light';
}

main();
