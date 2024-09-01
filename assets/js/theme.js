export const LIGHT_THEME_SET = 'light-theme-set';
export const DARK_THEME_SET = 'dark-theme-set';

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
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  localStorage.theme = 'dark';
  document.dispatchEvent(new Event(DARK_THEME_SET));
}

function setLightTheme() {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  localStorage.theme = 'light';
  document.dispatchEvent(new Event(LIGHT_THEME_SET));
}

export default function setup({ buttonId }) {
  document
    .getElementById(buttonId)
    .addEventListener('click', toggleDarkMode);

  if (isLightTheme()) {
    setLightTheme();
  }
}
