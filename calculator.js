(() => {
  const $ = (id) => document.getElementById(id);
  const tabs = Array.from(document.querySelectorAll('.calc-tab'));
  const views = Array.from(document.querySelectorAll('.calc-view'));

  function parseNumber(input) {
    if (!input) return NaN;
    const raw = String(input.value ?? '').trim().replace(',', '.');
    if (!raw) return NaN;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  function toMg(value, unit) {
    return unit === 'mcg' ? value / 1000 : value;
  }

  function fmt(value, max = 4) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    const digits = abs >= 100 ? Math.min(2, max) : abs >= 10 ? Math.min(3, max) : max;
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    }).format(value);
  }

  function amountLabel(mg) {
    if (!Number.isFinite(mg)) return '—';
    if (Math.abs(mg) < 1) return `${fmt(mg * 1000, 3)} mcg`;
    return `${fmt(mg, 4)} mg`;
  }

  function clear(ids) {
    ids.forEach(id => { const el = $(id); if (el) el.textContent = '—'; });
  }

  function warningForUnits(units) {
    if (!Number.isFinite(units)) return '';
    if (units > 100) return 'This result exceeds 100 U (1.00 mL) on a U-100 scale.';
    return '';
  }

  function calculateDose() {
    const vial = parseNumber($('doseVial'));
    const water = parseNumber($('doseWater'));
    const target = parseNumber($('doseTarget'));
    const vialMg = toMg(vial, $('doseVialUnit').value);
    const targetMg = toMg(target, $('doseTargetUnit').value);

    if (!(vialMg > 0) || !(water > 0) || !(targetMg > 0)) {
      $('doseUnits').textContent = '— units';
      clear(['doseMl','doseConc','dosePerUnit','doseCount']);
      $('doseAlert').textContent = '';
      return;
    }

    const concentration = vialMg / water;
    const mgPerUnit = concentration / 100;
    const units = targetMg / mgPerUnit;
    const ml = units / 100;
    const portions = vialMg / targetMg;

    $('doseUnits').textContent = `${fmt(units, 3)} units`;
    $('doseMl').textContent = `${fmt(ml, 4)} mL`;
    $('doseConc').textContent = `${fmt(concentration, 4)} mg/mL`;
    $('dosePerUnit').textContent = amountLabel(mgPerUnit);
    $('doseCount').textContent = fmt(portions, 3);
    $('doseAlert').textContent = warningForUnits(units);
  }

  function calculateUnits() {
    const vial = parseNumber($('unitsVial'));
    const water = parseNumber($('unitsWater'));
    const mark = parseNumber($('unitsMark'));
    const vialMg = toMg(vial, $('unitsVialUnit').value);

    if (!(vialMg > 0) || !(water > 0) || !(mark >= 0)) {
      $('unitsAmount').textContent = '—';
      clear(['unitsAmountAlt','unitsMl','unitsConc','unitsPerUnit']);
      $('unitsAlert').textContent = '';
      return;
    }

    const concentration = vialMg / water;
    const ml = mark / 100;
    const amountMg = concentration * ml;
    const mgPerUnit = concentration / 100;

    $('unitsAmount').textContent = `${fmt(amountMg * 1000, 3)} mcg`;
    $('unitsAmountAlt').textContent = `${fmt(amountMg, 5)} mg`;
    $('unitsMl').textContent = `${fmt(ml, 4)} mL`;
    $('unitsConc').textContent = `${fmt(concentration, 4)} mg/mL`;
    $('unitsPerUnit').textContent = amountLabel(mgPerUnit);
    $('unitsAlert').textContent = warningForUnits(mark);
  }

  function calculateBlend() {
    const a = parseNumber($('blendA'));
    const b = parseNumber($('blendB'));
    const water = parseNumber($('blendWater'));
    const target = parseNumber($('blendTarget'));
    const aMg = toMg(a, $('blendAUnit').value);
    const bMg = toMg(b, $('blendBUnit').value);
    const targetMg = toMg(target, $('blendTargetUnit').value);
    const basis = $('blendBasis').value;
    const nameA = ($('blendNameA').value || 'Component A').trim();
    const nameB = ($('blendNameB').value || 'Component B').trim();

    $('blendBasis').options[0].textContent = nameA;
    $('blendBasis').options[1].textContent = nameB;
    $('blendLabelA').textContent = nameA;
    $('blendLabelB').textContent = nameB;

    if (!(aMg > 0) || !(bMg > 0) || !(water > 0) || !(targetMg > 0)) {
      $('blendUnits').textContent = '— units';
      clear(['blendMl','blendOutA','blendOutB','blendRatio']);
      $('blendAlert').textContent = '';
      return;
    }

    const concA = aMg / water;
    const concB = bMg / water;
    const basisConc = basis === 'a' ? concA : concB;
    const ml = targetMg / basisConc;
    const units = ml * 100;
    const outA = concA * ml;
    const outB = concB * ml;
    const ratioBase = Math.min(aMg, bMg);
    const ratioA = aMg / ratioBase;
    const ratioB = bMg / ratioBase;

    $('blendUnits').textContent = `${fmt(units, 3)} units`;
    $('blendMl').textContent = `${fmt(ml, 4)} mL`;
    $('blendOutA').textContent = amountLabel(outA);
    $('blendOutB').textContent = amountLabel(outB);
    $('blendRatio').textContent = `${fmt(ratioA, 3)} : ${fmt(ratioB, 3)}`;
    $('blendAlert').textContent = warningForUnits(units);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.view;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      views.forEach(v => v.classList.toggle('active', v.id === `view-${key}`));
    });
  });

  document.querySelectorAll('#view-dose input,#view-dose select').forEach(el => {
    el.addEventListener('input', calculateDose);
    el.addEventListener('change', calculateDose);
  });
  document.querySelectorAll('#view-units input,#view-units select').forEach(el => {
    el.addEventListener('input', calculateUnits);
    el.addEventListener('change', calculateUnits);
  });
  document.querySelectorAll('#view-blend input,#view-blend select').forEach(el => {
    el.addEventListener('input', calculateBlend);
    el.addEventListener('change', calculateBlend);
  });

  calculateDose();
  calculateUnits();
  calculateBlend();
})();
