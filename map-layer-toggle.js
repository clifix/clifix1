// Assuming you have already initialized your map and marker cluster group
const map = L.map('map').setView([12.8797, 121.7740], 6); // Centered on Philippines

// Base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker cluster group for performance
const cityMarkers = L.markerClusterGroup({ chunkedLoading: true });
map.addLayer(cityMarkers);

// Loading indicator
const loadingControl = L.control({ position: 'topright' });
loadingControl.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'loading-control');
  this._div.innerHTML = '<div class="loading-spinner"></div>';
  this._div.style.display = 'none';
  return this._div;
};
loadingControl.addTo(map);

// Load all cities from cities.json
let allCities = [];

// Show loading indicator
function showLoading() {
  loadingControl._div.style.display = 'block';
}

// Hide loading indicator
function hideLoading() {
  loadingControl._div.style.display = 'none';
}

// Fetch city data from cities.json
showLoading();
fetch('cities.json') // Ensure this path is correct
  .then(res => {
    if (!res.ok) {
      throw new Error(`Failed to load cities data (HTTP ${res.status})`);
    }
    return res.json();
  })
  .then(data => {
    allCities = data;
    updateWeatherMarkers(); // Initial auto load
    map.on('moveend zoomend', updateWeatherMarkers); // Auto update on move
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
    alert('Failed to load city data. Please check console for details.');
  })
  .finally(() => {
    hideLoading();
  });

// Return visible cities only
function getVisibleCities() {
  const bounds = map.getBounds();
  return allCities.filter(c => bounds.contains([c.lat, c.lon]));
}

// Fetch weather data from Open-Meteo
async function fetchWeather(city) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Weather API error (HTTP ${res.status})`);
    }
    
    const data = await res.json();
    return {
      ...city,
      temp: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      wind: data.current.wind_speed_10m
    };
  } catch (error) {
    console.error(`Failed to fetch weather for ${city.name}:`, error);
    return {
      ...city,
      temp: '?',
      weatherCode: 0,
      wind: '?',
      error: true
    };
  }
}

// Emoji mapper
function getWeatherEmoji(code) {
  if ([0].includes(code)) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

// Custom weather marker
function createOWMStyleMarker(data) {
  const temp = data.error ? '?' : data.temp;
  const wind = data.error ? '?' : data.wind;
  const weatherEmoji = data.error ? '❓' : getWeatherEmoji(data.weatherCode);
  
  return L.marker([data.lat, data.lon], {
    icon: L.divIcon({
      className: `owm-marker ${data.error ? 'owm-marker-error' : ''}`,
      html: `
        <div class="owm-marker-container">
          <div class="owm-temperature">${temp}°</div>
          <div class="owm-weather">${weatherEmoji}</div>
        </div>
      `,
      iconSize: [40, 40]
    })
  }).bindPopup(`
    <div class="owm-popup">
      <div class="owm-popup-header">
        <span class="owm-city">${data.name}</span>
        <span class="owm-weather">${weatherEmoji}</span>
      </div>
      <div class="owm-popup-body">
        <div class="owm-temp">${temp}°C</div>
        <div class="owm-wind">💨 ${wind} km/h</div>
        ${data.error ? '<div class="owm-error">Weather data unavailable</div>' : ''}
      </div>
    </div>
  `);
}

// Fetch + render markers
async function updateWeatherMarkers() {
  showLoading();
  cityMarkers.clearLayers();
  
  try {
    const visible = getVisibleCities();
    const results = await Promise.allSettled(visible.map(fetchWeather));
    
    results.forEach(r => {
      if (r.status === "fulfilled") {
        const marker = createOWMStyleMarker(r.value);
        cityMarkers.addLayer(marker);
      }
    });
  } catch (error) {
    console.error('Error updating weather markers:', error);
  } finally {
    hideLoading();
  }
}