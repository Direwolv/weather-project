(function () {
  'use strict';
  const HS = window.HS;
  const MAX = 4;
  const STATE = { selected: [] };

  const $ = (s) => document.querySelector(s);
  const els = { pick: $('#pickRow'), body: $('#compareBody'), toast: $('#toast') };

  function showToast(msg, error) {
    els.toast.textContent = msg;
    els.toast.className = 'toast' + (error ? ' error' : '');
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function renderPicks() {
    els.pick.innerHTML = HS.DESTINATIONS.map(d => {
      const sel = STATE.selected.includes(d.name);
      return `
        <div class="pick-card ${sel ? 'selected' : ''}" data-name="${d.name}">
          <span class="pk-icon">${HS.destIcon(d)}</span>
          <span class="pk-name">${d.name}</span>
          <span class="pk-check">✓</span>
        </div>`;
    }).join('');
  }

  function toggle(name) {
    const i = STATE.selected.indexOf(name);
    if (i >= 0) STATE.selected.splice(i, 1);
    else {
      if (STATE.selected.length >= MAX) {
        showToast(`You can compare up to ${MAX} destinations. Remove one first.`, true);
        return;
      }
      STATE.selected.push(name);
    }
    renderPicks();
    load();
  }

  function cellValue(d, key) {
    const { weather, status } = d;
    switch (key) {
      case 'status': return status;
      case 'temp': return weather.main.temp;
      case 'feels': return weather.main.feels_like;
      case 'hum': return weather.main.humidity;
      case 'wind': return weather.wind.speed * 3.6;
      case 'vis': return (weather.visibility || 10000) / 1000;
      case 'press': return weather.main.pressure;
      case 'cloud': return weather.clouds.all;
    }
  }

  function bestWorst(rows, key) {
    if (!rows.length) return { best: null, worst: null };
    if (key === 'status') {
      const order = { critical: 0, caution: 1, good: 2 };
      const best = rows.reduce((a, b) => order[a.status] >= order[b.status] ? a : b);
      const worst = rows.reduce((a, b) => order[a.status] <= order[b.status] ? a : b);
      return { best: best.name, worst: worst.name };
    }
    const high = { temp: true, feels: true, wind: true, press: false, vis: true, hum: false, cloud: false };
    const asc = high[key] === true;
    const sorted = [...rows].sort((a, b) => cellValue(a, key) - cellValue(b, key));
    return { best: (asc ? sorted[sorted.length - 1] : sorted[0]).name, worst: (asc ? sorted[0] : sorted[sorted.length - 1]).name };
  }

  function renderRows(rows) {
    const defs = [
      { key: 'status', label: 'Travel status' },
      { key: 'temp', label: 'Temperature', fmt: v => `${v.toFixed(1)}\u00B0C` },
      { key: 'feels', label: 'Feels like', fmt: v => `${v.toFixed(1)}\u00B0C` },
      { key: 'hum', label: 'Humidity', fmt: v => `${v.toFixed(0)}%` },
      { key: 'wind', label: 'Wind', fmt: v => `${v.toFixed(0)} km/h` },
      { key: 'vis', label: 'Visibility', fmt: v => `${v.toFixed(1)} km` },
      { key: 'press', label: 'Pressure', fmt: v => `${v.toFixed(0)} hPa` },
      { key: 'cloud', label: 'Cloud cover', fmt: v => `${v.toFixed(0)}%` },
    ];
    const header = `<thead><tr><th>Metric</th>${rows.map(r =>
      `<th><span class="cmp-dest">${HS.destIcon(r.dest)} ${r.dest.name}</span></th>`).join('')}</tr></thead>`;
    const tbody = defs.map(def => {
      const { best, worst } = bestWorst(rows, def.key);
      const cells = rows.map(r => {
        let cls = '';
        if (r.name === best && rows.length > 1) cls = 'best';
        else if (r.name === worst && rows.length > 1) cls = 'worst';
        let val;
        if (def.key === 'status') {
          val = `<span class="cmp-badge badge-${r.status}">${HS.STATUS_LABEL[r.status]}</span>`;
        } else {
          val = def.fmt(cellValue(r, def.key));
        }
        return `<td class="${cls}">${val}</td>`;
      }).join('');
      return `<tr><td>${def.label}</td>${cells}</tr>`;
    }).join('');
    return `<table class="compare-table">${header}<tbody>${tbody}</tbody></table>`;
  }

  async function load() {
    if (!STATE.selected.length) {
      HS.renderEmpty(els.body, '👆', 'Select destinations to compare', 'Click up to 4 places above to see their live weather side by side.');
      return;
    }
    HS.renderLoading(els.body, 'Comparing destinations…');
    const dests = HS.DESTINATIONS.filter(d => STATE.selected.includes(d.name));
    const results = await Promise.allSettled(dests.map(HS.fetchWeather));
    const ok = results.filter(r => r.status === 'fulfilled');
    const errs = results.filter(r => r.status === 'rejected');
    if (errs.length && errs.every(e => e.reason && e.reason.message === 'api-key')) {
      HS.renderErrorState(els.body, 'OpenWeatherMap rejected the API key (401). Please activate your key on openweathermap.org.');
      return;
    }
    if (!ok.length) { HS.renderEmpty(els.body, '😕', 'No data available', 'Could not load weather data right now.'); return; }
    const rows = ok.map(r => r.value);
    els.body.innerHTML = `
      <div class="compare-table-wrap">${renderRows(rows)}</div>
      <p style="color:var(--muted);font-size:0.75rem;margin-top:1rem">Green = best for that metric · Red = worst · Data: OpenWeatherMap</p>`;
  }

  els.pick.addEventListener('click', (e) => {
    const card = e.target.closest('.pick-card');
    if (card) toggle(card.dataset.name);
  });

  const params = new URLSearchParams(location.search);
  const pre = params.get('d');
  if (pre && HS.DESTINATIONS.some(d => d.name === pre)) STATE.selected.push(pre);

  HS.setupNav();
  renderPicks();
  load();
})();