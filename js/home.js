(function () {
  'use strict';
  const HS = window.HS;
  const STATE = { data: new Map(), sort: 'status', view: 'grid' };

  const $ = (s) => document.querySelector(s);
  const els = {
    grid: $('#destGrid'),
    criticalGrid: $('#criticalGrid'),
    statTotal: $('#statTotal'),
    statGood: $('#statGood'),
    statCaution: $('#statCaution'),
    statCritical: $('#statCritical'),
    alert: $('#statusAlert'),
    lastUpdated: $('#lastUpdated'),
    modalOverlay: $('#modalOverlay'),
    modalBody: $('#modalBody'),
    modalClose: $('#modalClose'),
    refresh: $('#refreshBtn'),
    toast: $('#toast'),
    navStatus: $('#navStatus'),
    viewBtns: document.querySelectorAll('.view-btn'),
  };

  function showToast(msg, error) {
    els.toast.textContent = msg;
    els.toast.className = 'toast' + (error ? ' error' : '');
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function sortedData() {
    const arr = Array.from(STATE.data.values());
    arr.sort((a, b) => HS.SCORE[a.status] - HS.SCORE[b.status] || a.dest.name.localeCompare(b.dest.name));
    return arr;
  }

  function render() {
    const rows = sortedData();
    if (!rows.length) return;
    let good = 0, caution = 0, critical = 0;
    rows.forEach(r => { if (r.status === 'good') good++; else if (r.status === 'caution') caution++; else critical++; });

    els.statTotal.textContent = rows.length;
    els.statGood.textContent = good;
    els.statCaution.textContent = caution;
    els.statCritical.textContent = critical;
    els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const crit = rows.filter(r => r.status === 'critical');
    if (crit.length) {
      const names = crit.slice(0, 3).map(r => r.dest.name).join(', ');
      els.alert.hidden = false;
      els.alert.className = 'status-alert critical';
      els.alert.innerHTML = `<span class="alert-icon">🚨</span><div><b>Travel advisory:</b> <b>${crit.length}</b> destination${crit.length > 1 ? 's' : ''} under critical weather — ${names}${crit.length > 3 ? ' and more' : ''}. Re-check before you go.</div>`;
    } else if (caution) {
      els.alert.hidden = false;
      els.alert.className = 'status-alert caution';
      els.alert.innerHTML = `<span class="alert-icon">⚠️</span><div><b>Heads up:</b> <b>${caution}</b> destination${caution > 1 ? 's' : ''} need extra planning today.</div>`;
    } else {
      els.alert.hidden = true;
    }

    // Critical cards - featured horizontal cards
    if (crit.length) {
      els.criticalGrid.hidden = false;
      els.criticalGrid.innerHTML = crit.map((r, i) => HS.featuredCardHTML(r, i)).join('');
      els.criticalGrid.classList.add(STATE.view === 'list' ? 'list-view' : 'grid-view');
    } else {
      els.criticalGrid.hidden = true;
      els.criticalGrid.innerHTML = '';
    }

    // Main grid - caution and good
    const mainRows = rows.filter(r => r.status !== 'critical');
    els.grid.innerHTML = mainRows.map((r, i) => HS.cardHTML(r, i)).join('');
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
      els.navStatus.innerHTML = '<i class="live-dot off"></i>API down';
      HS.renderErrorState(els.grid, 'OpenWeatherMap rejected the API key (401). Please activate your key on openweathermap.org.');
      return;
    }
    if (errs.length) showToast(`${errs.length} location(s) failed to load and were skipped.`, true);
    if (!ok.length) { HS.renderEmpty(els.grid, '😕', 'No data available', 'Could not load any weather data right now.'); return; }

    STATE.data.clear();
    ok.forEach(r => STATE.data.set(r.value.dest.name, r.value));
    render();
  }

  els.grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card, .featured-card');
    if (card) {
      const r = STATE.data.get(card.dataset.name);
      if (r) HS.openModal(r);
    }
  });
  els.criticalGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.featured-card');
    if (card) {
      const r = STATE.data.get(card.dataset.name);
      if (r) HS.openModal(r);
    }
  });
  els.refresh.addEventListener('click', () => {
    els.refresh.disabled = true;
    load().finally(() => { els.refresh.disabled = false; });
  });
  els.viewBtns.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
  els.modalClose.addEventListener('click', () => { els.modalOverlay.hidden = true; document.body.style.overflow = ''; });
  els.modalOverlay.addEventListener('click', (e) => { if (e.target === els.modalOverlay) { els.modalOverlay.hidden = true; document.body.style.overflow = ''; } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { els.modalOverlay.hidden = true; document.body.style.overflow = ''; } });

  HS.setupNav();
  load();
  setInterval(load, HS.CONFIG.REFRESH_MS);
})();