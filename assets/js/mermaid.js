// Adapted from https://github.com/mermaid-js/mermaid/issues/1945#issuecomment-2077336760 (Thanks man <3)
import mermaid from 'mermaid';

const elementCode = '.mermaid';

function saveOriginalData(){
  const elements = document.querySelectorAll(elementCode);
  const count = elements.length;

  elements.forEach(element => {
    element.setAttribute('data-original-code', element.innerHTML)
  });
}

function resetProcessed() {
  const elements = document.querySelectorAll(elementCode);
  const count = elements.length;

  elements.forEach(element => {
    if (element.getAttribute('data-original-code') != null){
      element.removeAttribute('data-processed');
      element.innerHTML = element.getAttribute('data-original-code');
    }
  });
}

function loadMermaid(theme) {
  mermaid.initialize({ theme, startOnLoad: false });
  mermaid.run({ theme, nodes: document.querySelectorAll(elementCode) });
}

export function setupMermaid() {
  saveOriginalData();

  if (!localStorage.theme || localStorage.theme === 'dark') {
    loadMermaid('dark');
  } else {
    loadMermaid('default');
  }

  document.addEventListener('dark-theme-set', () => {
    resetProcessed();
    loadMermaid('dark');
  });

  document.addEventListener('light-theme-set', () => {
    resetProcessed();
    loadMermaid('default');
  });
}
