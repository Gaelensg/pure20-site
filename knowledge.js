'use strict';
(() => {
  const search = document.getElementById('peptide-search');
  if (!search) return;
  const entries = [...document.querySelectorAll('.entry')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const count = document.getElementById('result-count');
  let category = 'all';
  const normalise = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function update() {
    const terms = normalise(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const entry of entries) {
      const haystack = normalise(entry.dataset.search);
      const match = (category === 'all' || entry.dataset.category === category) && terms.every(term => haystack.includes(term));
      entry.hidden = !match;
      if (match) visible++;
    }
    count.textContent = `${visible} of ${entries.length} compounds`;
    document.getElementById('no-results').hidden = visible !== 0;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(); }));
  search.addEventListener('input', update);
  document.getElementById('clear-search').addEventListener('click', () => { search.value = ''; update(); search.focus(); });
  document.getElementById('reset-filters').addEventListener('click', () => { search.value = ''; category = 'all'; update(); search.focus(); });
  document.querySelector('.tools').hidden = false;
  update();
})();
