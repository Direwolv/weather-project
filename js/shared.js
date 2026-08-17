(function () {
  'use strict';

  const CONFIG = {
    PROVIDER: 'meteoblue',
    METEOBLUE_BASE: '/api/weather',
    METEOBLUE_PACKAGE: 'basic-1h_basic-day_clouds-3h_clouds-day',
    OWM_API_KEY: '',
    WEATHER: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
    OPEN_METEO: 'https://api.open-meteo.com/v1/forecast',
    WIKI_IMG: 'https://commons.wikimedia.org/w/api.php',
    REFRESH_MS: 30 * 60 * 1000,
  };

  const PROVIDER_CHAIN = CONFIG.PROVIDER === 'openweathermap' ? ['openweathermap', 'meteoblue', 'open-meteo']
    : CONFIG.PROVIDER === 'open-meteo' ? ['open-meteo']
    : ['meteoblue', 'open-meteo'];

  let activeProvider = PROVIDER_CHAIN[0];

  function nextProvider(current) {
    const i = PROVIDER_CHAIN.indexOf(current);
    if (i < 0 || i >= PROVIDER_CHAIN.length - 1) return null;
    const n = PROVIDER_CHAIN[i + 1];
    if (n === 'openweathermap' && !CONFIG.OWM_API_KEY) return nextProvider(n);
    return n;
  }

  const DESTINATIONS = [
    { name: 'Dhaka', region: 'Dhaka Division', lat: 23.8103, lon: 90.4125, asl: 10, img: 'Dhaka', type: 'City', desc: 'Capital city — culture, food & historic landmarks.' },
    { name: 'Chattogram', region: 'Chattogram Division', lat: 22.3569, lon: 91.7832, asl: 10, img: 'Chattogram', type: 'City', desc: 'Largest seaport city and gateway to the hills.' },
    { name: 'Cox\u2019s Bazar', region: 'Chattogram Division', lat: 21.4272, lon: 92.0058, asl: 5, img: "Cox's Bazar beach", type: 'Beach', desc: 'Home to the world\u2019s longest uninterrupted sandy beach.' },
    { name: 'Sylhet', region: 'Sylhet Division', lat: 24.8949, lon: 91.8687, asl: 35, img: 'Sylhet', type: 'City', desc: 'Tea gardens, wetlands and scenic hillocks.' },
    { name: 'Sreemangal', region: 'Sylhet Division', lat: 24.3065, lon: 91.7296, asl: 40, img: 'Sreemangal tea garden', type: 'Tea', desc: 'The tea capital — lush estates and Lawachara forest.' },
    { name: 'Khulna & Sundarbans', region: 'Khulna Division', lat: 22.8456, lon: 89.5403, asl: 5, img: 'Sundarbans mangrove', type: 'Forest', desc: 'Gateway to the Sundarbans mangrove forest.' },
    { name: 'Bagerhat', region: 'Khulna Division', lat: 22.6512, lon: 89.7855, asl: 5, img: 'Sixty Dome Mosque', type: 'Heritage', desc: 'Historic mosques — a UNESCO World Heritage site.' },
    { name: 'Rajshahi', region: 'Rajshahi Division', lat: 24.3745, lon: 88.6042, asl: 25, img: 'Rajshahi', type: 'City', desc: 'Silk city on the Padma river, famed for mangoes.' },
    { name: 'Rangpur', region: 'Rangpur Division', lat: 25.7439, lon: 89.2752, asl: 35, img: 'Rangpur', type: 'City', desc: 'Northern city with historic Kantajew Temple nearby.' },
    { name: 'Barishal', region: 'Barishal Division', lat: 22.701, lon: 90.3535, asl: 5, img: 'Barishal', type: 'Rivers', desc: 'The Venice of the East — riverine town of palms & canals.' },
    { name: 'Mymensingh', region: 'Mymensingh Division', lat: 24.7471, lon: 90.4203, asl: 20, img: 'Mymensingh', type: 'City', desc: 'River port with hill tract and folk heritage vibes.' },
    { name: 'Bandarban', region: 'Chattogram Division', lat: 22.1953, lon: 92.2184, asl: 600, img: 'Bandarban', type: 'Hill', desc: 'Highest peaks in Bangladesh — Nilgiri & Boga Lake.' },
    { name: 'Rangamati', region: 'Chattogram Division', lat: 22.6516, lon: 92.2835, asl: 300, img: 'Rangamati lake', type: 'Hill', desc: 'Kaptai Lake, tribal culture and green hills.' },
    { name: 'Kuakata', region: 'Barishal Division', lat: 21.8167, lon: 90.1167, asl: 5, img: 'Kuakata beach', type: 'Beach', desc: 'Rare beach where you can watch both sunrise & sunset.' },
    { name: 'Saint Martin\u2019s Island', region: 'Chattogram Division', lat: 20.6167, lon: 92.3333, asl: 5, img: 'Saint Martins Island Bangladesh', type: 'Island', desc: 'Coral island — the southernmost point of Bangladesh.' },
    { name: 'Paharpur', region: 'Rajshahi Division', lat: 25.0314, lon: 88.9774, asl: 40, img: 'Somapura Mahavihara', type: 'Heritage', desc: 'Somapura Mahavihara — a UNESCO World Heritage site.' },
  ];

  const ICON_MAP = {
    '01d': '☀️', '01n': '🌙', '02d': '🌤', '02n': '☁️',
    '03d': '⛅', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧', '09n': '🌧', '10d': '🌦', '10n': '🌧',
    '11d': '⛈', '11n': '⛈', '13d': '🌨', '13n': '🌨',
    '50d': '🌫', '50n': '🌫',
  };

  const WMO = {
    0: { id: 800, main: 'Clear', desc: 'Clear sky', icon: '01d' },
    1: { id: 801, main: 'Clouds', desc: 'Mainly clear', icon: '02d' },
    2: { id: 802, main: 'Clouds', desc: 'Partly cloudy', icon: '03d' },
    3: { id: 804, main: 'Clouds', desc: 'Overcast', icon: '04d' },
    45: { id: 741, main: 'Fog', desc: 'Fog', icon: '50d' },
    48: { id: 741, main: 'Fog', desc: 'Depositing rime fog', icon: '50d' },
    51: { id: 310, main: 'Drizzle', desc: 'Light drizzle', icon: '09d' },
    53: { id: 311, main: 'Drizzle', desc: 'Drizzle', icon: '09d' },
    55: { id: 312, main: 'Drizzle', desc: 'Dense drizzle', icon: '09d' },
    56: { id: 511, main: 'Drizzle', desc: 'Freezing drizzle', icon: '13d' },
    57: { id: 511, main: 'Drizzle', desc: 'Freezing drizzle', icon: '13d' },
    61: { id: 500, main: 'Rain', desc: 'Slight rain', icon: '10d' },
    63: { id: 501, main: 'Rain', desc: 'Moderate rain', icon: '10d' },
    65: { id: 502, main: 'Rain', desc: 'Heavy rain', icon: '10d' },
    66: { id: 511, main: 'Rain', desc: 'Freezing rain', icon: '13d' },
    67: { id: 511, main: 'Rain', desc: 'Freezing rain', icon: '13d' },
    71: { id: 600, main: 'Snow', desc: 'Slight snow', icon: '13d' },
    73: { id: 601, main: 'Snow', desc: 'Snow', icon: '13d' },
    75: { id: 602, main: 'Snow', desc: 'Heavy snow', icon: '13d' },
    77: { id: 611, main: 'Snow', desc: 'Snow grains', icon: '13d' },
    80: { id: 500, main: 'Rain', desc: 'Light rain shower', icon: '09d' },
    81: { id: 501, main: 'Rain', desc: 'Rain shower', icon: '09d' },
    82: { id: 502, main: 'Rain', desc: 'Violent rain shower', icon: '09d' },
    85: { id: 601, main: 'Snow', desc: 'Snow shower', icon: '13d' },
    86: { id: 602, main: 'Snow', desc: 'Heavy snow shower', icon: '13d' },
    95: { id: 200, main: 'Thunderstorm', desc: 'Thunderstorm', icon: '11d' },
    96: { id: 201, main: 'Thunderstorm', desc: 'Thunderstorm with hail', icon: '11d' },
    99: { id: 202, main: 'Thunderstorm', desc: 'Thunderstorm with hail', icon: '11d' },
  };

  const METEOBLUE_HOURLY = {
    1: { id: 800, main: 'Clear', desc: 'Clear sky', icon: '01d' },
    2: { id: 801, main: 'Clear', desc: 'Clear, few cirrus', icon: '01d' },
    3: { id: 801, main: 'Clouds', desc: 'Clear with cirrus', icon: '01d' },
    4: { id: 801, main: 'Clouds', desc: 'Clear with few low clouds', icon: '02d' },
    5: { id: 801, main: 'Clouds', desc: 'Clear with few low clouds', icon: '02d' },
    6: { id: 801, main: 'Clouds', desc: 'Clear with a few clouds', icon: '02d' },
    7: { id: 802, main: 'Clouds', desc: 'Partly cloudy', icon: '03d' },
    8: { id: 802, main: 'Clouds', desc: 'Partly cloudy', icon: '03d' },
    9: { id: 802, main: 'Clouds', desc: 'Partly cloudy', icon: '03d' },
    10: { id: 801, main: 'Clouds', desc: 'Thunderstorm clouds possible', icon: '04d' },
    11: { id: 801, main: 'Clouds', desc: 'Thunderstorm clouds possible', icon: '04d' },
    12: { id: 801, main: 'Clouds', desc: 'Thunderstorm clouds possible', icon: '04d' },
    13: { id: 701, main: 'Mist', desc: 'Clear but hazy', icon: '50d' },
    14: { id: 701, main: 'Mist', desc: 'Clear but hazy', icon: '50d' },
    15: { id: 701, main: 'Mist', desc: 'Clear but hazy', icon: '50d' },
    16: { id: 741, main: 'Fog', desc: 'Fog / low stratus', icon: '50d' },
    17: { id: 741, main: 'Fog', desc: 'Fog / low stratus', icon: '50d' },
    18: { id: 741, main: 'Fog', desc: 'Fog / low stratus', icon: '50d' },
    19: { id: 803, main: 'Clouds', desc: 'Mostly cloudy', icon: '04d' },
    20: { id: 803, main: 'Clouds', desc: 'Mostly cloudy', icon: '04d' },
    21: { id: 803, main: 'Clouds', desc: 'Mostly cloudy', icon: '04d' },
    22: { id: 804, main: 'Clouds', desc: 'Overcast', icon: '04d' },
    23: { id: 501, main: 'Rain', desc: 'Overcast with rain', icon: '10d' },
    24: { id: 601, main: 'Snow', desc: 'Overcast with snow', icon: '13d' },
    25: { id: 502, main: 'Rain', desc: 'Overcast with heavy rain', icon: '10d' },
    26: { id: 602, main: 'Snow', desc: 'Overcast with heavy snow', icon: '13d' },
    27: { id: 201, main: 'Thunderstorm', desc: 'Rain, thunderstorms likely', icon: '11d' },
    28: { id: 200, main: 'Thunderstorm', desc: 'Light rain, thunderstorms likely', icon: '11d' },
    29: { id: 602, main: 'Snow', desc: 'Storm with heavy snow', icon: '13d' },
    30: { id: 202, main: 'Thunderstorm', desc: 'Heavy rain, thunderstorms likely', icon: '11d' },
    31: { id: 500, main: 'Rain', desc: 'Mixed with showers', icon: '09d' },
    32: { id: 600, main: 'Snow', desc: 'Mixed with snow showers', icon: '13d' },
    33: { id: 500, main: 'Rain', desc: 'Overcast with light rain', icon: '10d' },
    34: { id: 600, main: 'Snow', desc: 'Overcast with light snow', icon: '13d' },
    35: { id: 611, main: 'Snow', desc: 'Overcast, snow and rain', icon: '13d' },
  };

  const METEOBLUE_DAILY = {
    1: { id: 800, main: 'Clear', desc: 'Sunny, cloudless sky', icon: '01d' },
    2: { id: 801, main: 'Clear', desc: 'Sunny and few clouds', icon: '02d' },
    3: { id: 802, main: 'Clouds', desc: 'Partly cloudy', icon: '03d' },
    4: { id: 804, main: 'Clouds', desc: 'Overcast', icon: '04d' },
    5: { id: 741, main: 'Fog', desc: 'Fog', icon: '50d' },
    6: { id: 501, main: 'Rain', desc: 'Overcast with rain', icon: '10d' },
    7: { id: 500, main: 'Rain', desc: 'Mixed with showers', icon: '09d' },
    8: { id: 201, main: 'Thunderstorm', desc: 'Showers, thunderstorms likely', icon: '11d' },
    9: { id: 601, main: 'Snow', desc: 'Overcast with snow', icon: '13d' },
    10: { id: 600, main: 'Snow', desc: 'Mixed with snow showers', icon: '13d' },
    11: { id: 611, main: 'Snow', desc: 'Mixture of snow and rain', icon: '13d' },
    12: { id: 500, main: 'Rain', desc: 'Overcast with light rain', icon: '10d' },
    13: { id: 600, main: 'Snow', desc: 'Overcast with light snow', icon: '13d' },
    14: { id: 501, main: 'Rain', desc: 'Mostly cloudy with rain', icon: '10d' },
    15: { id: 601, main: 'Snow', desc: 'Mostly cloudy with snow', icon: '13d' },
    16: { id: 500, main: 'Rain', desc: 'Mostly cloudy, light rain', icon: '09d' },
    17: { id: 600, main: 'Snow', desc: 'Mostly cloudy, light snow', icon: '13d' },
  };

  const TYPE_ICONS = {
    Beach: '🏖️', Island: '🏝️', Hill: '⛰️', Forest: '🌳',
    Heritage: '🏛️', Tea: '🍃', Rivers: '🚣', City: '🏙️',
  };

  const STATUS_LABEL = { good: 'Good', caution: 'Caution', critical: 'Critical' };
  const SCORE = { critical: 0, caution: 1, good: 2 };

  const destIcon = (d) => TYPE_ICONS[d.type] || '📍';
  const flagOf = () => '🇧🇩';
  const iconOf = (code) => ICON_MAP[code] || '🌡';
  const dataSource = () => (activeProvider === 'meteoblue' ? 'Meteoblue'
    : activeProvider === 'openweathermap' ? 'OpenWeatherMap' : 'Open-Meteo');

  function statusOf(weather) {
    const w = weather.weather && weather.weather[0];
    const id = w ? w.id : 800;
    const main = w ? w.main : '';
    const temp = weather.main ? weather.main.temp : 25;
    const windMs = weather.wind ? weather.wind.speed : 0;
    const windKmh = windMs * 3.6;
    const vis = weather.visibility || 10000;
    const reasons = { critical: [], caution: [] };

    if (id >= 200 && id <= 232) reasons.critical.push('Thunderstorm / lightning in progress — high risk of floods & travel disruption');
    if (w && /thunder/i.test(w.description) && !(id >= 200 && id <= 232)) {
      reasons.caution.push('Thunderstorm clouds building — skies can turn quickly, stay alert');
    }
    if (id >= 502 && id <= 531) reasons.critical.push('Heavy rain — flash flooding & waterlogging likely');
    if (id >= 500 && id <= 501) reasons.caution.push('Moderate rain — slippery roads and delays expected');
    if (id >= 300 && id <= 321) reasons.caution.push('Drizzle — light rain, pack rain gear');
    if (id >= 600 && id <= 622) reasons.caution.push('Snow in the hills — cold weather travel');
    if (main === 'Fog' || id === 741) {
      if (vis < 1500) reasons.critical.push('Dense fog — very poor visibility, drive with extreme caution');
      else reasons.caution.push('Foggy conditions — reduced visibility');
    }
    if (temp >= 41) reasons.critical.push(`Extreme heat (${temp.toFixed(1)}\u00B0C) — heatstroke risk`);
    else if (temp >= 36) reasons.caution.push(`High heat (${temp.toFixed(1)}\u00B0C) — stay hydrated, avoid midday sun`);
    if (windKmh >= 60) reasons.critical.push(`High winds (${windKmh.toFixed(0)} km/h) — storms, flying debris`);
    else if (windKmh >= 30) reasons.caution.push(`Breezy (${windKmh.toFixed(0)} km/h) — secure loose items`);
    if (vis < 500) reasons.critical.push('Visibility below 500 m — travel not advised');
    else if (vis < 2000) reasons.caution.push('Reduced visibility — take it slow');

    let status = 'good';
    if (reasons.critical.length) status = 'critical';
    else if (reasons.caution.length) status = 'caution';

    return { status, critical: reasons.critical, caution: reasons.caution };
  }

  function buildGuide(dest, weather, res) {
    const t = weather.main ? weather.main.temp : 25;
    const windKmh = weather.wind ? weather.wind.speed * 3.6 : 0;
    const rain = (weather.rain && (weather.rain['1h'] || weather.rain['3h'])) || 0;
    const coastal = ['Cox\u2019s Bazar', 'Kuakata', 'Saint Martin\u2019s Island', 'Barishal', 'Khulna & Sundarbans'].includes(dest.name);
    const hills = dest.type === 'Hill';
    const guide = [];
    const push = (icon, text, type) => guide.push({ icon, text, type });

    if (res.status === 'critical') {
      push('⛔', `Travel status: ${res.critical[0]}`, 'critical');
      if (res.critical.some(r => /rain|flood|Thunderstorm/i.test(r)) || rain > 10) {
        push('🌊', 'Avoid river crossings, low-lying roads and footpaths — flash floods possible.', 'critical');
      }
      if (res.critical.some(r => /wind|storm/i.test(r))) {
        push('🌬', 'Stay indoors, avoid the coast, and follow Bangladesh Meteorological Department alerts.', 'critical');
      }
      if (res.critical.some(r => /heat/i.test(r))) {
        push('🥵', 'Reschedule outdoor sightseeing to early morning or evening; carry ORS and water.', 'critical');
      }
      push('🚁', 'Consider delaying travel unless essential. Book transport only after confirming schedules.', 'caution');
    } else if (res.status === 'caution') {
      push('⚠️', res.caution[0], 'caution');
      push('🧳', 'Pack light rain gear / umbrella and wear non-slip footwear.', 'caution');
      if (coastal) push('🏖', 'Beach visits still possible — but keep an eye on tide and sky; avoid sea bathing in rough conditions.', 'caution');
      if (hills) push('⛰', 'Hill roads may be slippery — use experienced drivers and check road conditions.', 'caution');
      push('📱', 'Keep your phone charged and save emergency contacts (999, 1090 tourism helpline).', 'caution');
    } else {
      push('✅', 'Ideal conditions for travel. Great time to explore.', 'good');
      if (coastal) push('🏖', 'Perfect for beach time, boat rides and sunset watching — always swim within marked zones.', 'good');
      if (hills) push('⛰', 'Excellent visibility on the hill roads — great for hiking, waterfalls and viewpoints.', 'good');
      if (dest.type === 'Heritage') push('📸', 'Crisp skies for heritage photography and long walks.', 'good');
      if (dest.type === 'Tea') push('🍃', 'Lovely weather to walk the tea estates and forests.', 'good');
      push('⏰', 'Still start early to beat the crowds and the heat of the day.', 'good');
    }

    if (rain > 5) push('☔', `Rainfall reported (~${rain.toFixed(1)} mm) — waterproof your gear and electronics.`, 'caution');
    if (t >= 33) push('💧', `Heat index is high (feels like ${(weather.main.feels_like ?? t).toFixed(1)}\u00B0C) — drink water every 30 min.`, 'caution');
    if (windKmh > 35 && coastal) push('🌊', `Sea is rough (wind ${windKmh.toFixed(0)} km/h) — avoid boat excursions today.`, 'critical');

    return guide;
  }

  function cardHTML(r, delay) {
    const { dest, weather, status } = r;
    const w = weather.weather && weather.weather[0];
    const temp = weather.main.temp;
    const hum = weather.main.humidity;
    const wind = weather.wind.speed * 3.6;
    return `
      <article class="card" data-name="${dest.name}" data-status="${status}" style="animation-delay:${Math.min(delay * 45, 500)}ms">
        <div class="card-top">
          <span class="card-badge badge-${status}"><i class="badge-dot"></i>${STATUS_LABEL[status]}</span>
          <span class="card-status-icon">${destIcon(dest)}</span>
        </div>
        <div class="card-body">
          <h2><span class="flag">${flagOf()}</span>${dest.name}</h2>
          <p class="card-sub">${dest.region} · ${dest.type}</p>
        </div>
        <div class="card-weather">
          <div class="weather-cond">
            <span class="weather-icon">${iconOf(w && w.icon)}</span>
            <div class="weather-text">
              <div class="temp">${temp.toFixed(1)}<span>\u00B0C</span></div>
              <div class="desc">${w ? w.description : '—'}</div>
            </div>
          </div>
          <div class="weather-metrics">
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M5 21h14"/></svg>${hum}%</div>
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18"/></svg>${wind.toFixed(0)} km/h</div>
          </div>
        </div>
        <div class="card-foot">
          <span>${dest.desc}</span>
          <span class="guide-link">Guide <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      </article>`;
  }

  function featuredCardHTML(r, delay) {
    const { dest, weather, status, critical, caution } = r;
    const w = weather.weather && weather.weather[0];
    const temp = weather.main.temp;
    const feels = weather.main.feels_like;
    const hum = weather.main.humidity;
    const wind = weather.wind.speed * 3.6;
    const vis = weather.visibility ? (weather.visibility / 1000).toFixed(1) : '—';
    const reasons = [...(critical || []), ...(caution || [])];
    const mainReason = reasons[0] || 'Critical weather conditions';
    return `
      <article class="featured-card" data-name="${dest.name}" data-status="${status}" style="animation-delay:${Math.min(delay * 60, 600)}ms">
        <div class="featured-badge">
          <span class="featured-type">${destIcon(dest)} ${dest.type}</span>
          <h2><span class="flag">${flagOf()}</span>${dest.name}</h2>
          <span class="card-badge badge-${status}"><i class="badge-dot"></i>${STATUS_LABEL[status]}</span>
          <p class="featured-sub">${dest.region}</p>
        </div>
        <div class="featured-content">
          <div class="featured-weather">
            <span class="featured-icon">${iconOf(w && w.icon)}</span>
            <div class="featured-temp">
              <div class="temp">${temp.toFixed(1)}<span>\u00B0C</span></div>
              <div class="desc">${w ? w.description : '—'}</div>
            </div>
          </div>
          <div class="featured-reason">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="reason-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>${mainReason}</span>
          </div>
          <div class="featured-metrics">
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M5 21h14"/></svg><span class="metric-value">${hum}%</span><span class="metric-label">Humidity</span></div>
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18"/></svg><span class="metric-value">${wind.toFixed(0)} km/h</span><span class="metric-label">Wind</span></div>
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12M12 2L12 12"/></svg><span class="metric-value">${vis} km</span><span class="metric-label">Visibility</span></div>
            <div class="metric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12M12 2L12 12"/></svg><span class="metric-value">${feels.toFixed(1)}\u00B0C</span><span class="metric-label">Feels like</span></div>
          </div>
        </div>
        <div class="featured-foot">
          <span class="featured-desc">${dest.desc}</span>
          <span class="guide-link">View details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      </article>`;
  }

  function modalHTML(r) {
    const { dest, weather, status, guide } = r;
    const w = weather.weather && weather.weather[0];
    const temp = weather.main.temp;
    const feels = weather.main.feels_like;
    const hum = weather.main.humidity;
    const press = weather.main.pressure;
    const wind = weather.wind.speed * 3.6;
    const vis = weather.visibility ? (weather.visibility / 1000).toFixed(1) : '—';
    const stText = status === 'good' ? 'Safe to travel' : status === 'caution' ? 'Travel with caution' : 'Not advised to travel';
    const stDesc = status === 'good' ? 'Conditions are favourable.'
      : status === 'caution' ? (r.caution && r.caution[0]) || 'Some conditions need attention.'
      : (r.critical && r.critical[0]) || 'Conditions are hazardous.';
    const stClass = status === 'good' ? 'st-good' : status === 'caution' ? 'st-caution' : 'st-critical';
    const guideList = guide.map(g => `<li class="${g.type}"><span class="g-icon">${g.icon}</span><span>${g.text}</span></li>`).join('');

    return `
      <div class="gallery" data-query="${encodeURIComponent(dest.img || dest.name)}">
        <div class="gallery-hero">
          <img class="gallery-img" alt="${dest.name} — loading photo" />
          <div class="gallery-shade"></div>
          <div class="gallery-caption">
            <span class="gallery-type">${destIcon(dest)} ${dest.type} · ${dest.region}</span>
            <h2>${flagOf()} ${dest.name}</h2>
            <p>${dest.desc}</p>
          </div>
          <div class="gallery-temp">${temp.toFixed(1)}<span>\u00B0C</span></div>
          <span class="gallery-badge badge-${status}"><i class="badge-dot"></i>${STATUS_LABEL[status]}</span>
        </div>
        <div class="gallery-strip"><div class="gallery-loading"><span></span><span></span><span></span></div></div>
      </div>
      <div class="modal-status ${stClass}">
        <span>${status === 'good' ? '✅' : status === 'caution' ? '⚠️' : '🚨'}</span>
        <div><div>${STATUS_LABEL[status]} — ${stText}</div><div class="status-desc">${stDesc}</div></div>
      </div>
      <div class="modal-metrics">
        <div class="metric-tile"><div class="m-label">Feels like</div><div class="m-value">${feels.toFixed(1)}\u00B0C</div></div>
        <div class="metric-tile"><div class="m-label">Humidity</div><div class="m-value">${hum}%</div></div>
        <div class="metric-tile"><div class="m-label">Wind</div><div class="m-value">${wind.toFixed(0)} <small>km/h</small></div></div>
        <div class="metric-tile"><div class="m-label">Visibility</div><div class="m-value">${vis} <small>km</small></div></div>
        <div class="metric-tile"><div class="m-label">Pressure</div><div class="m-value">${press} <small>hPa</small></div></div>
        <div class="metric-tile"><div class="m-label">Condition</div><div class="m-value">${w ? w.main : '—'}</div></div>
      </div>
      <div class="guide-section">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Travel Guide — ${dest.name}</h3>
        <ul class="guide-list">${guideList}</ul>
      </div>
      <div class="modal-actions">
        <a class="btn btn-ghost" href="/forecast?d=${encodeURIComponent(dest.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>5-day forecast
        </a>
        <a class="btn btn-ghost" href="/compare?d=${encodeURIComponent(dest.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>Compare
        </a>
      </div>
      <div class="modal-footer">Data: ${dataSource()} · Photos: Wikimedia Commons · Status is advisory and auto-computed from live conditions.</div>`;
  }

  /* ---------- Photo gallery (Wikimedia Commons) ---------- */
  async function fetchImages(query, limit) {
    const p = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${query} Bangladesh`,
      gsrnamespace: 6,
      gsrlimit: limit,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: 900,
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${CONFIG.WIKI_IMG}?${p}`, {
      headers: { 'User-Agent': 'HawaScope/1.0 (Bangladesh weather travel site)' },
    });
    if (!res.ok) throw new Error('images');
    const data = await res.json();
    const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];
    const urls = [];
    pages.forEach(pg => {
      const ii = pg.imageinfo && pg.imageinfo[0];
      if (!ii) return;
      const url = ii.thumburl || ii.url;
      if (/\.(jpe?g|png|webp)/i.test(url)) urls.push(url);
    });
    return urls;
  }

  function setHero(img, src) {
    img.classList.add('switching');
    img.src = src;
    img.onload = () => { img.classList.remove('switching'); };
    img.onerror = () => { img.classList.remove('switching'); };
  }

  async function loadGallery(dest, gallery) {
    const strip = gallery.querySelector('.gallery-strip');
    const img = gallery.querySelector('.gallery-img');
    try {
      const images = await fetchImages(gallery.dataset.query || dest.name, 6);
      if (!images.length) throw new Error('none');
      gallery.classList.add('has-images');
      setHero(img, images[0]);
      strip.innerHTML = images.map((u, i) =>
        `<img class="thumb ${i === 0 ? 'active' : ''}" src="${u}" alt="${dest.name} — photo ${i + 1}" data-i="${i}" loading="lazy" />`).join('');
      strip.addEventListener('click', (e) => {
        const t = e.target.closest('.thumb');
        if (!t) return;
        strip.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        setHero(img, images[Number(t.dataset.i)]);
      });
    } catch (e) {
      gallery.classList.add('no-images');
      strip.innerHTML = `<div class="gallery-note">Photos unavailable right now.</div>`;
    }
  }

  function openModal(r) {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    body.innerHTML = modalHTML(r);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const gallery = body.querySelector('.gallery');
    if (gallery) loadGallery(r.dest, gallery);
  }

  /* ---------- Page Hero & Block Galleries ---------- */
  async function loadHeroGallery(container) {
    const img = container.querySelector('.guide-hero-img, .about-hero-img, .about-stats-img');
    if (!img) return;
    try {
      const images = await fetchImages(container.dataset.query, 1);
      if (!images.length) throw new Error('none');
      img.src = images[0];
      img.onload = () => img.classList.add('loaded');
      img.onerror = () => container.classList.add('no-images');
    } catch (e) {
      container.classList.add('no-images');
    }
  }

  async function loadBlockGalleries() {
    const galleries = document.querySelectorAll('.guide-block-gallery, .about-block-gallery');
    for (const gallery of galleries) {
      const query = gallery.closest('[data-gallery-query]')?.dataset.galleryQuery;
      if (!query) continue;
      try {
        const images = await fetchImages(query, 1);
        if (!images.length) throw new Error('none');
        gallery.innerHTML = `<img src="${images[0]}" alt="" loading="lazy" />`;
        requestAnimationFrame(() => gallery.classList.add('loaded'));
      } catch (e) {
        gallery.style.display = 'none';
      }
    }
  }

  function initPageGalleries() {
    const heroGalleries = document.querySelectorAll('.guide-hero-gallery, .about-hero-gallery, .about-stats-gallery');
    heroGalleries.forEach(loadHeroGallery);
    loadBlockGalleries();
  }

  /* ---------- Meteoblue adapters ---------- */
  function meteoblueUrl(dest) {
    const p = new URLSearchParams({
      lat: dest.lat,
      lon: dest.lon,
      asl: dest.asl || 15,
    });
    return `${CONFIG.METEOBLUE_BASE}?${p}`;
  }

  function dhakaNow() {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
    const hour = parts.hour === '24' ? '00' : parts.hour;
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour };
  }

  function idxOf(arr, v) { for (let i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }

  function normalizeMeteoblue(data, dest) {
    const h1 = data.data_1h;
    const h3 = data.data_3h;
    const now = dhakaNow();
    let icur = idxOf(h1.time, `${now.date} ${now.hour}:00`);
    if (icur < 0) icur = 0;
    const h3floor = String(Math.floor(now.hour / 3) * 3).padStart(2, '0');
    let i3 = idxOf(h3.time, `${now.date} ${h3floor}:00`);
    if (i3 < 0) i3 = 0;
    const pc = METEOBLUE_HOURLY[h1.pictocode[icur]] || METEOBLUE_HOURLY[22];
    return {
      name: dest.name,
      dt: Math.floor(Date.now() / 1000),
      main: {
        temp: h1.temperature[icur],
        feels_like: h1.felttemperature[icur],
        humidity: h1.relativehumidity[icur],
        pressure: h1.sealevelpressure[icur],
        temp_min: h1.temperature[icur],
        temp_max: h1.temperature[icur],
      },
      weather: [{ id: pc.id, main: pc.main, description: pc.desc, icon: pc.icon }],
      wind: { speed: h1.windspeed[icur] },
      visibility: h3.visibility[i3] || 10000,
      clouds: { all: h3.totalcloudcover[i3] || 0 },
      rain: h1.precipitation[icur] ? { '1h': h1.precipitation[icur] } : undefined,
      snowfraction: h1.snowfraction[icur],
    };
  }

  function normalizeMeteoblueForecast(data) {
    const h1 = data.data_1h;
    const h3 = data.data_3h;
    const list = [];
    for (let i = 0; i < h1.time.length; i += 3) {
      const t = h1.time[i];
      const pc = METEOBLUE_HOURLY[h1.pictocode[i]] || METEOBLUE_HOURLY[22];
      let vis = 10000, cloud = 0;
      const i3 = idxOf(h3.time, t);
      if (i3 >= 0) { vis = h3.visibility[i3] || 10000; cloud = h3.totalcloudcover[i3] || 0; }
      list.push({
        dt: Math.floor(Date.parse(`${t.slice(0, 10)}T${t.slice(11, 16)}:00+06:00`) / 1000),
        dt_txt: t.slice(0, 16),
        main: {
          temp: h1.temperature[i],
          temp_min: h1.temperature[i],
          temp_max: h1.temperature[i],
          humidity: h1.relativehumidity[i],
          pressure: h1.sealevelpressure[i],
        },
        weather: [{ id: pc.id, main: pc.main, description: pc.desc, icon: pc.icon }],
        wind: { speed: h1.windspeed[i] },
        visibility: vis,
        clouds: { all: cloud },
      });
    }
    return { list };
  }

  async function fetchMeteoblue(dest) {
    const res = await fetch(meteoblueUrl(dest));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeMeteoblue(await res.json(), dest);
  }

  async function fetchMeteoblueForecast(dest) {
    const res = await fetch(meteoblueUrl(dest));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeMeteoblueForecast(await res.json());
  }

  /* ---------- Open-Meteo adapters ---------- */
  function normalizeCurrent(data, dest) {
    const c = data.current;
    const wmo = WMO[c.weather_code] || WMO[0];
    return {
      name: dest.name,
      dt: Math.floor(Date.now() / 1000),
      main: {
        temp: c.temperature_2m,
        feels_like: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        pressure: c.pressure_msl,
        temp_min: c.temperature_2m,
        temp_max: c.temperature_2m,
      },
      weather: [{ id: wmo.id, main: wmo.main, description: wmo.desc, icon: wmo.icon }],
      wind: { speed: (c.wind_speed_10m || 0) / 3.6 },
      visibility: c.visibility || 10000,
      clouds: { all: c.cloud_cover || 0 },
      rain: c.precipitation ? { '1h': c.precipitation } : undefined,
    };
  }

  function normalizeForecast(data) {
    const h = data.hourly;
    const list = [];
    for (let i = 0; i < h.time.length; i += 3) {
      const t = h.time[i];
      const wmo = WMO[h.weather_code[i]] || WMO[0];
      const localMs = Date.parse(t + 'Z');
      list.push({
        dt: Math.floor((localMs - 6 * 3600 * 1000) / 1000),
        dt_txt: t,
        main: {
          temp: h.temperature_2m[i],
          temp_min: h.temperature_2m[i],
          temp_max: h.temperature_2m[i],
          humidity: h.relative_humidity_2m[i],
          pressure: h.pressure_msl[i],
        },
        weather: [{ id: wmo.id, main: wmo.main, description: wmo.desc, icon: wmo.icon }],
        wind: { speed: (h.wind_speed_10m[i] || 0) / 3.6 },
        visibility: h.visibility[i] || 10000,
      });
    }
    return { list };
  }

  async function fetchOpenMeteoCurrent(dest) {
    const p = new URLSearchParams({
      latitude: dest.lat,
      longitude: dest.lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,visibility,cloud_cover',
      timezone: 'Asia/Dhaka',
    });
    const res = await fetch(`${CONFIG.OPEN_METEO}?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeCurrent(await res.json(), dest);
  }

  async function fetchOpenMeteoForecast(dest) {
    const p = new URLSearchParams({
      latitude: dest.lat,
      longitude: dest.lon,
      hourly: 'temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,visibility,weather_code',
      timezone: 'Asia/Dhaka',
      forecast_days: 5,
    });
    const res = await fetch(`${CONFIG.OPEN_METEO}?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeForecast(await res.json());
  }

  async function fetchOWMWeather(dest) {
    const url = `${CONFIG.WEATHER}?lat=${dest.lat}&lon=${dest.lon}&units=metric&appid=${CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) throw new Error('api-key');
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }

  async function fetchOWMForecast(dest) {
    const url = `${CONFIG.FORECAST}?lat=${dest.lat}&lon=${dest.lon}&units=metric&appid=${CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) throw new Error('api-key');
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }

  function enrich(data, dest) {
    const s = statusOf(data);
    return { dest, weather: data, status: s.status, critical: s.critical, caution: s.caution, guide: buildGuide(dest, data, s) };
  }

  async function fetchWeather(dest) {
    let provider = activeProvider;
    while (provider) {
      try {
        let data;
        if (provider === 'meteoblue') data = await fetchMeteoblue(dest);
        else if (provider === 'openweathermap') data = await fetchOWMWeather(dest);
        else data = await fetchOpenMeteoCurrent(dest);
        return enrich(data, dest);
      } catch (e) {
        const next = nextProvider(provider);
        if (!next) throw e;
        provider = activeProvider = next;
      }
    }
    throw new Error('No provider available');
  }

  async function fetchForecast(dest) {
    let provider = activeProvider;
    while (provider) {
      try {
        if (provider === 'meteoblue') return await fetchMeteoblueForecast(dest);
        if (provider === 'openweathermap') return await fetchOWMForecast(dest);
        return await fetchOpenMeteoForecast(dest);
      } catch (e) {
        const next = nextProvider(provider);
        if (!next) throw e;
        provider = activeProvider = next;
      }
    }
    throw new Error('No provider available');
  }

  function renderErrorState(container, message) {
    container.innerHTML = `
      <div class="empty-state error">
        <div class="empty-icon">🔑</div>
        <h2>Weather API key not active</h2>
        <p>${message}</p>
        <p style="margin-top:0.8rem">Check that the <code>METEOBLUE_KEY</code> environment variable is set on your host, then refresh.</p>
      </div>`;
  }

  function renderEmpty(container, icon, title, sub) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h2>${title}</h2>
        <p>${sub}</p>
      </div>`;
  }

  function renderLoading(container, text) {
    container.innerHTML = `
      <div class="skeleton-grid">
        ${Array(6).fill('<div class="skeleton-card"></div>').join('')}
      </div>
      <div class="empty-state" style="margin-top: 1rem;">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p style="margin-top: 0.75rem; color: var(--muted); font-size: 0.85rem;">${text || 'Loading destinations…'}</p>
      </div>`;
  }

  function setupNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') links.classList.remove('open');
      });
    }
    const path = location.pathname.replace(/\.html$/, '').split('/').filter(Boolean).join('/') || 'index.html';
    document.querySelectorAll('.nav-link').forEach(a => {
      const href = a.getAttribute('href').replace(/^\/+/, '').replace(/\.html$/, '');
      if (href === path || (path === 'index.html' && href === '')) a.classList.add('active');
    });
    setupTheme();
  }

  function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  }

  const HS = {
    CONFIG, DESTINATIONS, ICON_MAP, TYPE_ICONS, STATUS_LABEL, SCORE, dataSource,
    statusOf, buildGuide, cardHTML, featuredCardHTML, modalHTML, openModal, fetchImages,
    destIcon, flagOf, iconOf,
    fetchWeather, fetchForecast, renderErrorState, renderEmpty, renderLoading,
    setupNav, setupTheme,
  };

  if (typeof window !== 'undefined') window.HS = HS;
  if (typeof module !== 'undefined' && module.exports) module.exports = HS;
})();