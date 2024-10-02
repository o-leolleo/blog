const createI18MenuHandler = (menuId) => function toggleI18nMenu(e) {
  const i18nMenu = document.getElementById(menuId);

  if (e.type === 'focusout' && i18nMenu.contains(e.relatedTarget)) {
    return;
  }

  i18nMenu.classList.toggle('hidden');
}

export default function setup({ buttonId, menuId }) {
  const i18nButton = document.getElementById(buttonId);

  if (i18nButton) {
    const toggleI18nMenu = createI18MenuHandler(menuId);
    i18nButton.addEventListener('click', toggleI18nMenu);
    i18nButton.addEventListener('focusout', toggleI18nMenu);
  }
}
