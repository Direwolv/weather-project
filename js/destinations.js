(function () {
  'use strict';
  const HS = window.HS;
  const STATE = { data: new Map(), filter: 'All', query: '', view: 'grid' };

  const $ = (s) => document.querySelector(s);
  const els = {
    grid: $('#destGrid'),
    search: $('#search'),
    chips: $('#chips'),
    summary: $('#summaryBar'),
    sumTotal: $('#sumTotal'),
    sumGood: $('#sumGood'),
    sumCaution: $('#sumCaution'),
    sumCritical: $('#sumCritical'),
    lastUpdated: $('#lastUpdated'),
    modalOverlay: $('#modalOverlay'),
    modalBody: $('#modalBody'),
    modalClose: $('#modalClose'),
    viewBtns: document.querySelectorAll('.view-btn'),
  };

  const TYPES = ['All', 'City', 'Beach', 'Hill', 'Forest', 'Heritage', 'Tea', 'Rivers', 'Island'];

  function renderChips() {
    els.chips.innerHTML = TYPES.map(t =>
      `<button class="chip ${t === STATE.filter ? 'active' : ''}" data-type="${t}">${t}</button>`).join('');
  }

  function filtered() {
    const arr = Array.from(STATE.data.values());
    return arr.filter(r => {
      if (STATE.filter !== 'All' && r.dest.type !== STATE.filter) return false;
      if (STATE.query) {
        const q = STATE.query.toLowerCase();
        const hay = (r.dest.name + ' ' + r.dest.region + ' ' + r.dest.desc).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    const rows = filtered();
    if (!STATE.data.size) return;
    els.summary.hidden = false;
    let good = 0, caution = 0, critical = 0;
    rows.forEach(r => { if (r.status === 'good') good++; else if (r.status === 'caution') caution++; else critical++; });
    els.sumTotal.textContent = rows.length;
    els.sumGood.textContent = good;
    els.sumCaution.textContent = caution;
    els.sumCritical.textContent = critical;
    els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (!rows.length) {
      HS.renderEmpty(els.grid, '🔍', 'No matches found', 'Try a different search term or filter.');
      return;
    }
    els.grid.innerHTML = rows.map((r, i) => HS.cardHTML(r, i)).join('');
    els.grid.classList.toggle('list-view', STATE.view === 'list');
    els.grid.classList.toggle('grid-view', STATE.view === 'grid');
  }

  function setView(view) {
    STATE.view = view;
    els.viewBtns.forEach(btn => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
    render();
  }

  async function load() {
    HS.renderLoading(els.grid, 'Fetching real-time weather…');
    const results = await Promise.allSettled(HS.DESTINATIONS.map(HS.fetchWeather));
    const ok = results.filter(r => r.status === 'fulfilled');
    const errs = results.filter(r => r.status === 'rejected');
    if (errs.length && errs.every(e => e.reason && e.reason.message === 'api-key')) {
      HS.renderErrorState(els.grid, 'OpenWeatherMap rejected the API key (401). Please activate your key on openweathermap.org.');
      return;
    }
    if (!ok.length) { HS.renderEmpty(els.grid, '😕', 'No data available', 'Could not load any weather data right now.'); return; }
    STATE.data.clear();
    ok.forEach(r => STATE.data.set(r.value.dest.name, r.value));
    renderChips();
    render();
  }

  els.chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    STATE.filter = chip.dataset.type;
    renderChips();
    render();
  });
  els.search.addEventListener('input', (e) => { STATE.query = e.target.value.trim(); render(); });
  els.grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      const r = STATE.data.get(card.dataset.name);
      if (r) HS.openModal(r);
    }
  });
  els.viewBtns.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
  els.modalClose.addEventListener('click', () => { els.modalOverlay.hidden = true; document.body.style.overflow = ''; });
  els.modalOverlay.addEventListener('click', (e) => { if (e.target === els.modalOverlay) { els.modalOverlay.hidden = true; document.body.style.overflow = ''; } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { els.modalOverlay.hidden = true; document.body.style.overflow = ''; } });

  HS.setupNav();
  renderChips();
  load();
})();