(function () {
  'use strict';
  const HS = window.HS;

  const $ = (s) => document.querySelector(s);
  const els = {
    select: $('#destSelect'),
    body: $('#forecastBody'),
    toast: $('#toast'),
  };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function showToast(msg, error) {
    els.toast.textContent = msg;
    els.toast.className = 'toast' + (error ? ' error' : '');
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function groupByDay(list) {
    const map = new Map();
    list.forEach(it => {
      const key = it.dt_txt.slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { key, dt: it.dt, entries: [] });
      }
      map.get(key).entries.push(it);
    });
    return Array.from(map.values());
  }

  function dhakaToday() {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' });
    return f.format(new Date());
  }

  function dayCard(day, i) {
    const min = Math.min(...day.entries.map(e => e.main.temp_min));
    const max = Math.max(...day.entries.map(e => e.main.temp_max));
    const noon = day.entries.find(e => e.dt_txt.includes('T12:00')) || day.entries[Math.min(day.entries.length - 1, Math.floor(day.entries.length / 2))];
    const w = noon.weather[0];
    const parts = day.key.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const isToday = day.key === dhakaToday();
    const label = isToday ? 'Today' : date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.getDate();
    const range = max - min || 1;
    const lo = 20, hi = 40;
    const left = Math.max(0, Math.min(100, ((min - lo) / (hi - lo)) * 100));
    const width = Math.max(6, Math.min(100, (range / (hi - lo)) * 100));
    return `
      <div class="fc-day ${isToday ? 'today' : ''}">
        <div class="fc-day-name">${label}</div>
        <div class="fc-day-icon">${HS.iconOf(w.icon)}</div>
        <div class="fc-desc">${w.description}</div>
        <div class="fc-range"><span class="lo">${min.toFixed(1)}\u00B0</span><span class="hi">${max.toFixed(1)}\u00B0</span></div>
        <div class="fc-bar">
          <div class="fc-bar-track">
            <div class="fc-bar-fill" style="left:${left}%;width:${width}%"></div>
          </div>
        </div>
      </div>`;
  }

  function renderHourly(hours) {
    return hours.map(h => {
      const t = new Date(h.dt * 1000);
      const w = h.weather[0];
      return `
        <div class="hour-tile">
          <div class="h-time">${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="h-icon">${HS.iconOf(w.icon)}</div>
          <div class="h-temp">${h.main.temp.toFixed(0)}\u00B0</div>
        </div>`;
    }).join('');
  }

  function renderCurrent(dest, cur, fc) {
    const w = cur.weather && cur.weather[0];
    const t = cur.main.temp;
    const wind = cur.wind.speed * 3.6;
    const s = HS.statusOf(cur);
    const next24 = fc.list.slice(0, 8);
    return `
      <div class="fc-current">
        <div class="fc-left">
          <span class="weather-icon">${HS.iconOf(w && w.icon)}</span>
          <div>
            <h2 style="font-size:1.4rem;font-weight:800">${HS.flagOf()} ${dest.name}</h2>
            <div class="fc-temp">${t.toFixed(1)}<span>\u00B0C</span></div>
            <div class="fc-desc">${w ? w.description : '—'} · ${HS.STATUS_LABEL[s.status]}</div>
          </div>
        </div>
        <div class="fc-metrics">
          <div class="fm"><b>${cur.main.feels_like.toFixed(1)}\u00B0C</b>Feels like</div>
          <div class="fm"><b>${cur.main.humidity}%</b>Humidity</div>
          <div class="fm"><b>${wind.toFixed(0)} km/h</b>Wind</div>
          <div class="fm"><b>${((cur.visibility || 10000) / 1000).toFixed(1)} km</b>Visibility</div>
        </div>
      </div>
      <div class="section-head"><div><h2>Next 24 hours</h2></div></div>
      <div class="hourly-scroll">${renderHourly(next24)}</div>
      <div class="section-head"><div><h2>5-day outlook</h2></div></div>
      <div class="fc-grid">${groupByDay(fc.list).slice(0, 5).map((d, i) => dayCard(d, i)).join('')}</div>
      <p style="color:var(--muted);font-size:0.75rem;margin-top:1.4rem">Forecast intervals: 3-hourly · Data: ${HS.dataSource()}</p>`;
  }

  async function load(destName) {
    const dest = HS.DESTINATIONS.find(d => d.name === destName) || HS.DESTINATIONS[0];
    els.select.value = dest.name;
    HS.renderLoading(els.body, `Fetching forecast for ${dest.name}…`);
    const [curRes, fcRes] = await Promise.allSettled([HS.fetchWeather(dest), HS.fetchForecast(dest)]);
    if (curRes.status === 'rejected' || fcRes.status === 'rejected') {
      const e = curRes.status === 'rejected' ? curRes.reason : fcRes.reason;
      if (e && e.message === 'api-key') {
        HS.renderErrorState(els.body, 'OpenWeatherMap rejected the API key (401). Please activate your key on openweathermap.org.');
      } else {
        HS.renderEmpty(els.body, '😕', 'Could not load forecast', 'Please try again shortly.');
      }
      return;
    }
    els.body.innerHTML = renderCurrent(dest, curRes.value, fcRes.value);
  }

  els.select.innerHTML = HS.DESTINATIONS.map(d => `<option value="${d.name}">${d.name} — ${d.region}</option>`).join('');
  els.select.addEventListener('change', () => load(els.select.value));

  const params = new URLSearchParams(location.search);
  const initial = params.get('d');
  HS.setupNav();
  load(initial);
})();