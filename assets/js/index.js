import * as params from '@params';

import setupMermaid from 'js/mermaid';
import setupScroll from 'js/scroll';
import setupI18n from 'js/i18n';
import setupTheme, { DARK_THEME_SET, LIGHT_THEME_SET } from 'js/theme';

function main() {
  setupScroll({ buttonId: 'scroll-to-top' });

  if (params.hasMermaid) {
    setupMermaid({
      darkThemeSetEvent: DARK_THEME_SET,
      lightThemeSetEvent: LIGHT_THEME_SET,
    });
  }

  setupTheme({ buttonId: 'dark-mode-btn' });
  setupI18n({ buttonId: 'i18n-btn', menuId: 'i18n-menu' });
}

window.addEventListener('DOMContentLoaded', main);
