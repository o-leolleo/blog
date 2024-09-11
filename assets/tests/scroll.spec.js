import { jest } from '@jest/globals';
import setupScroll from '../js/scroll.js';

function assertButtonIs({ hidden }) {
  expect(document.getElementById('scroll-button').classList.contains('opacity-0')).toBe(hidden);
}

describe('scroll', () => {
  beforeEach(() => {
    document.body.innerHTML = `<button id="scroll-button">Scroll To Top</button>`;
  })

  it('Scrolls to top when button is clicked', () => {
    document.documentElement.scrollTo = jest.fn();

    setupScroll({ buttonId: 'scroll-button' });
    document.getElementById('scroll-button').click();

    expect(document.documentElement.scrollTo).toHaveBeenCalledWith({ top: 0 });
  })

  it('Shows button when scrolled past 20%', () => {
    Object.defineProperties(HTMLElement.prototype, {
      scrollHeight: { get: () => 150, configurable: true },
      clientHeight: { get: () => 50, configurable: true }
    });

    setupScroll({ buttonId: 'scroll-button' });
    document.documentElement.scrollTop = 21;
    document.dispatchEvent(new Event('scroll'));

    assertButtonIs({ hidden: false });
  })

  it('Hides button when scrolled less than or 20%', () => {
    Object.defineProperties(HTMLElement.prototype, {
      scrollHeight: { get: () => 150, configurable: true },
      clientHeight: { get: () => 50, configurable: true }
    });

    setupScroll({ buttonId: 'scroll-button' });

    document.documentElement.scrollTop = 20;
    document.dispatchEvent(new Event('scroll'));

    assertButtonIs({ hidden: true });
  })
});
