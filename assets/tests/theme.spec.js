import setupTheme, { DARK_THEME_SET, LIGHT_THEME_SET } from '../js/theme';

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.classList.add('dark');
    document.body.innerHTML = `<button id="theme-button" class="dark">Toggle Theme</button>`;
  });

  it('Uses dark theme by default', () => {
    setupTheme({ buttonId: 'theme-button' });
    expect(localStorage.theme).toBe(undefined);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('Sets theme to light if localStorage.theme is not dark', (done) => {
    localStorage.theme = 'light';

    document.addEventListener(LIGHT_THEME_SET, () => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      done();
    });

    setupTheme({ buttonId: 'theme-button' });
  })

  it.each([
    {theme: 'light', from: 'dark', event: LIGHT_THEME_SET},
    {theme: 'dark', from: 'light', event: DARK_THEME_SET}
  ])('Toggles theme to $theme when button is clicked', ({ theme, from, event }, done) => {
    localStorage.theme = from;

    document.addEventListener(event, () => {
      expect(document.documentElement.classList.contains(theme)).toBe(true);
      expect(document.documentElement.classList.contains(from)).toBe(false);
      expect(localStorage.theme).toBe(theme);

      done();
    });

    setupTheme({ buttonId: 'theme-button' });
    document.getElementById('theme-button').click();
  });
});
