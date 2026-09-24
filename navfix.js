(() => {
  document.querySelectorAll('header nav a, footer a').forEach(a => {
    const label = (a.textContent || '').trim().toLowerCase();
    const href = a.getAttribute('href') || '';
    if ((label === 'shop' || label === 'winkel') && (href === '/' || href === '/index.html' || href === 'index.html')) {
      a.setAttribute('href', '/shop');
    }
  });
})();