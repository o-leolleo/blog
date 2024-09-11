import { jest } from '@jest/globals';

import { createMain } from '../js/index';

import setupScroll from '../js/scroll';
import setupMermaid from '../js/mermaid';
import setupI18n from '../js/i18n';
import setupTheme from '../js/theme';

jest.mock('../js/scroll', () => jest.fn());
jest.mock('../js/mermaid', () => jest.fn());
jest.mock('../js/i18n', () => jest.fn());
jest.mock('../js/theme', () => jest.fn());

describe('index', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Sets up required dependencies', () => {
    createMain({ hasMermaid: true })();
    expect(setupScroll).toHaveBeenCalled();
    expect(setupMermaid).toHaveBeenCalled();
    expect(setupI18n).toHaveBeenCalled();
    expect(setupTheme).toHaveBeenCalled();
  });

  it('Skips mermaid setup if not enabled', () => {
    createMain({ hasMermaid: false })();
    expect(setupMermaid).not.toHaveBeenCalled();
  });
});
