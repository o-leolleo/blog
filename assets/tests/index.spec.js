import { jest } from '@jest/globals';

jest.mock('../js/scroll.js');
jest.mock('../js/mermaid.js');
jest.mock('../js/i18n.js');

describe('index', () => {
  it('is a placeholder test', () => {
    expect(true).toBe(true);
  });
});
