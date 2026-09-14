// Keep external font CSS off the critical rendering path. This separate script
// follows the site's Content Security Policy without inline event handlers.
const fontStyles = document.getElementById('klay-fonts');
if (fontStyles) {
  const applyFonts = () => { fontStyles.media = 'all'; };
  fontStyles.addEventListener('load', applyFonts, { once: true });
  if (fontStyles.sheet) applyFonts();
}
