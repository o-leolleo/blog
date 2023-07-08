const darkModeButton = document.getElementById('dark-mode-btn');
const scrollToTopButton = document.getElementById('scroll-to-top');
const rootElement = document.documentElement;

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
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  localStorage.theme = 'dark';
}

function setLightTheme() {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  localStorage.theme = 'light';
}

function scrollToTop() {
  rootElement.scrollTo({
    top: 0
  });
}

function handleScroll() {
  const scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;

  if ((rootElement.scrollTop / scrollTotal ) > 0.05 ) {
    // Show button
    scrollToTopButton.classList.remove("opacity-0", "translate-y-6");
  } else {
    // Hide button
    scrollToTopButton.classList.add("opacity-0", "translate-y-6");
  }
}

scrollToTopButton.addEventListener('click', scrollToTop);
document.addEventListener('scroll', handleScroll);
window.addEventListener('DOMContentLoaded', main);
