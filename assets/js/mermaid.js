// Adapted from https://github.com/mermaid-js/mermaid/issues/1945#issuecomment-2077336760 (Thanks man <3)
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.esm.min.mjs';

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

function main() {
  saveOriginalData();
  mermaid.initialize({ theme: 'dark', startOnLoad: false });
  mermaid.run({ theme: 'dark', nodes: document.querySelectorAll(elementCode) });

  document.addEventListener('dark-theme-set', () => {
    resetProcessed();
    mermaid.initialize({ theme: 'dark', startOnLoad: false });
    mermaid.run({ theme: 'dark', nodes: document.querySelectorAll(elementCode) });
  });

  document.addEventListener('light-theme-set', () => {
    resetProcessed();
    mermaid.initialize({ theme: 'default', startOnLoad: false });
    mermaid.run({ theme: 'default', nodes: document.querySelectorAll(elementCode) });
  });
}

window.addEventListener('DOMContentLoaded', main);
