function main() {
  document.getElementById('dark-mode-btn').addEventListener('click', toggleDarkMode);

  if (localStorage.theme && localStorage.theme !== 'dark') {
    setTheme(localStorage.theme);
  }
}

function toggleDarkMode() {
  const theme = localStorage.theme || 'dark';

  if (theme !== 'dark') {
    setTheme('dark');
    return;
  }

  setTheme('light');
}

function setTheme(theme = 'dark') {
  const icon = document.getElementById('dark-mode-icon');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    icon.classList.replace('la-sun', 'la-moon');

    localStorage.theme = 'dark';

    return;
  }

  document.documentElement.classList.remove('dark');
  icon.classList.replace('la-moon', 'la-sun');

  localStorage.theme = 'light';
}

main();
