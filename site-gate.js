(() => {
  if (window.__PURE20_ACCESS_GATE__) return;
  window.__PURE20_ACCESS_GATE__ = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (/^\/(admin|wholesale-admin|dashboard|portal)(\/|$)/i.test(path)) return;

  const ACCEPT_KEY = 'pure20_access_gate_v1';
  const LANG_KEY = 'pure20_language';

  function hasAccepted() {
    try {
      const raw = localStorage.getItem(ACCEPT_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed?.accepted === true;
    } catch (_) {
      return false;
    }
  }

  if (hasAccepted()) return;

  const copy = {
    nl: {
      kicker: 'VOOR JE VERDERGAAT',
      title: 'Welkom bij PURE20.',
      intro: 'PURE20 biedt researchproducten uitsluitend aan voor onderzoeksdoeleinden. Bevestig onderstaande punten voordat je de website verder gebruikt.',
      languageLabel: 'TAAL',
      age: 'Ik ben minstens 18 jaar.',
      research: 'Ik begrijp dat de producten op PURE20 uitsluitend worden aangeboden voor onderzoeksdoeleinden en niet bestemd zijn voor gebruik op mensen of dieren.',
      continue: 'AKKOORD & DOORGAAN',
      foot: 'Door verder te gaan bevestig je dat bovenstaande verklaringen correct zijn.',
      selectNl: 'Nederlands',
      selectEn: 'English'
    },
    en: {
      kicker: 'BEFORE YOU CONTINUE',
      title: 'Welcome to PURE20.',
      intro: 'PURE20 offers research products for research purposes only. Please confirm the statements below before continuing to the website.',
      languageLabel: 'LANGUAGE',
      age: 'I am at least 18 years old.',
      research: 'I understand that products on PURE20 are offered for research purposes only and are not intended for use in humans or animals.',
      continue: 'AGREE & CONTINUE',
      foot: 'By continuing, you confirm that the statements above are accurate.',
      selectNl: 'Nederlands',
      selectEn: 'English'
    }
  };

  let lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'nl';

  function injectCss() {
    if (document.getElementById('pure20GateCss')) return;
    const link = document.createElement('link');
    link.id = 'pure20GateCss';
    link.rel = 'stylesheet';
    link.href = '/site-gate.css';
    document.head.appendChild(link);
  }

  function build() {
    injectCss();

    const overlay = document.createElement('div');
    overlay.id = 'pure20AccessGate';
    overlay.className = 'p20-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'p20GateTitle');

    overlay.innerHTML = `
      <div class="p20-gate-backdrop"></div>
      <section class="p20-gate-card">
        <div class="p20-gate-brand">PURE20.</div>

        <div class="p20-gate-copy">
          <p class="p20-gate-kicker" data-gate-copy="kicker"></p>
          <h1 id="p20GateTitle" data-gate-copy="title"></h1>
          <p class="p20-gate-intro" data-gate-copy="intro"></p>
        </div>

        <label class="p20-gate-select-label">
          <span data-gate-copy="languageLabel"></span>
          <div class="p20-gate-select-wrap">
            <span class="p20-gate-flag" id="p20GateFlag" aria-hidden="true">🇳🇱</span>
            <select id="p20GateLanguage">
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
            </select>
            <span class="p20-gate-chevron" aria-hidden="true">⌄</span>
          </div>
        </label>

        <label class="p20-gate-check">
          <input id="p20GateAge" type="checkbox">
          <span class="p20-check-box" aria-hidden="true"></span>
          <span data-gate-copy="age"></span>
        </label>

        <label class="p20-gate-check p20-gate-check-large">
          <input id="p20GateResearch" type="checkbox">
          <span class="p20-check-box" aria-hidden="true"></span>
          <span data-gate-copy="research"></span>
        </label>

        <button id="p20GateContinue" class="p20-gate-continue" type="button" disabled>
          <span data-gate-copy="continue"></span>
          <span aria-hidden="true">›</span>
        </button>

        <p class="p20-gate-foot" data-gate-copy="foot"></p>
      </section>
    `;

    document.body.appendChild(overlay);
    document.documentElement.classList.add('p20-gate-open');
    document.body.classList.add('p20-gate-open');

    const select = document.getElementById('p20GateLanguage');
    const age = document.getElementById('p20GateAge');
    const research = document.getElementById('p20GateResearch');
    const button = document.getElementById('p20GateContinue');
    const flag = document.getElementById('p20GateFlag');

    function applyLanguage(next) {
      lang = next === 'en' ? 'en' : 'nl';
      select.value = lang;
      flag.textContent = lang === 'en' ? '🇬🇧' : '🇳🇱';
      overlay.querySelectorAll('[data-gate-copy]').forEach(el => {
        const key = el.dataset.gateCopy;
        if (copy[lang][key] != null) el.textContent = copy[lang][key];
      });
    }

    function updateButton() {
      button.disabled = !(age.checked && research.checked);
    }

    select.addEventListener('change', () => applyLanguage(select.value));
    age.addEventListener('change', updateButton);
    research.addEventListener('change', updateButton);

    button.addEventListener('click', () => {
      if (!age.checked || !research.checked) return;

      try {
        localStorage.setItem(LANG_KEY, lang);
        localStorage.setItem(ACCEPT_KEY, JSON.stringify({
          accepted: true,
          age18: true,
          researchOnly: true,
          language: lang,
          acceptedAt: new Date().toISOString()
        }));
      } catch (_) {}

      // Reload once so every page, dynamic component and navigation starts
      // immediately in the language chosen in the gate.
      location.reload();
    });

    applyLanguage(lang);
    updateButton();

    // Keep keyboard focus inside the required decision.
    setTimeout(() => select.focus({preventScroll:true}), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build, {once:true});
  } else {
    build();
  }
})();