import { jest } from '@jest/globals';
import setupMermaid from '../js/mermaid';
import mermaid from '../js/shims/mermaid';

jest.mock('../js/shims/mermaid', () => ({
  initialize: jest.fn(),
  run: jest.fn(),
}));

function assertMermaidReloadedWith({ theme }) {
  expect(mermaid.initialize).toHaveBeenCalledWith({ theme, startOnLoad: false });
  expect(mermaid.run).toHaveBeenCalledWith({ theme, nodes: document.querySelectorAll('.mermaid') });
}

describe('mermaid', () => {
  beforeEach(() => {
    const graph = 'graph TD; A-->B; A-->C; B-->D; C-->D;';
    document.body.innerHTML = `
      <div class="mermaid">${graph}</div>
    `
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { expectedTheme: 'dark' },
    { storedTheme: 'light', expectedTheme: 'default' },
    { storedTheme: 'dark', expectedTheme: 'dark' },
  ])(
    'Load mermaid theme $mermaidTheme when storedTheme is $storedTheme ',
    ({ storedTheme, expectedTheme }) => {
      if (storedTheme) {
        localStorage.theme = storedTheme;
      }

      setupMermaid();

      assertMermaidReloadedWith({ theme: expectedTheme });
    }
  );

  it.each([
    { changeTo: 'light', expectedTheme: 'default' },
    { changeTo: 'dark', expectedTheme: 'dark' },
    { storedTheme: 'light', changeTo: 'dark', expectedTheme: 'dark' },
    { storedTheme: 'light', changeTo: 'light', expectedTheme: 'default' },
    { storedTheme: 'dark', changeTo: 'light', expectedTheme: 'default' },
    { storedTheme: 'dark', changeTo: 'dark', expectedTheme: 'dark' },
  ])(
    'Changes to $expectedTheme if changed to $changeTo theme from $storedTheme via event',
    ({ storedTheme, changeTo, expectedTheme }) => {
      if (storedTheme) {
        localStorage.theme = storedTheme;
      }

      setupMermaid();

      document.dispatchEvent(new Event(`${changeTo}-theme-set`));

      assertMermaidReloadedWith({ theme: expectedTheme });
    }
  );
});
