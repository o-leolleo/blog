import * as params from '@params';

import setupMermaid from './mermaid';
import setupScroll from './scroll';
import setupI18n from './i18n';
import setupTheme from './theme';

export const createMain = ({ hasMermaid }) => function main() {
  setupScroll({ buttonId: 'scroll-to-top' });

  if (hasMermaid) {
    setupMermaid();
  }

  setupTheme({ buttonId: 'dark-mode-btn' });
  setupI18n({ buttonId: 'i18n-btn', menuId: 'i18n-menu' });
}

window.addEventListener('DOMContentLoaded', createMain(params));
