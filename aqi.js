const apiKey = '9317cf1fd095795d69a65b6878d087b7'; // Replace with your OpenWeather API key

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetchAQIData(lat, lon);
  }, () => {
    alert('Geolocation not allowed. Unable to fetch AQI.');
  });

  async function fetchAQIData(lat, lon) {
    const currentUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    const aqi = currentData.list[0].main.aqi;
    const aqiValue = convertAQI(aqi);
    const status = getAQIStatus(aqi);
    const advice = getAQIDescription(aqi);

    // Update UI
    document.getElementById('aqi-value').textContent = aqiValue;
    const categoryEl = document.getElementById('aqi-category');
    categoryEl.textContent = status;
    categoryEl.className = 'aqi-category ' + status.toLowerCase().replace(' ', '-');
    document.getElementById('aqi-advice').textContent = advice;

    // Update Hero Section AQI
const heroAqiValue = document.getElementById('hero-aqi-value');
const heroAqiCategory = document.getElementById('hero-aqi-category');

if (heroAqiValue && heroAqiCategory) {
  heroAqiValue.textContent = aqiValue;
  heroAqiCategory.textContent = status;
  heroAqiCategory.className = 'aqi-category ' + status.toLowerCase().replace(' ', '-');
}

    renderGauge(aqiValue);
    renderTrendChart(forecastData.list.slice(0, 72));
  }

  function convertAQI(aqi) {
    return [50, 100, 150, 200, 300][aqi - 1];
  }

  function getAQIStatus(aqi) {
    return ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1];
  }

  function getAQIDescription(aqi) {
    return [
      "Air quality is satisfactory, and air pollution poses little or no risk.",
      "Air quality is acceptable. Sensitive individuals may experience minor symptoms.",
      "Unhealthy for sensitive groups. Children and elderly should reduce outdoor activities.",
      "Unhealthy. Everyone may experience health effects.",
      "Very unhealthy. Serious health effects; avoid outdoor exertion."
    ][aqi - 1];
  }

  function renderGauge(value) {
    const ctx = document.getElementById('aqiGauge').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value, 300 - value],
          backgroundColor: ['#4CAF50', '#ddd'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
          title: {
            display: true,
            text: `AQI ${value}`,
            position: 'center',
            color: '#333',
            font: { size: 18, weight: 'bold' }
          }
        }
      }
    });
  }

  function renderTrendChart(data) {
    const labels = data.map(e => new Date(e.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const values = data.map(e => convertAQI(e.main.aqi));

    const ctx = document.getElementById('aqiTrendChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'AQI Forecast',
          data: values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 300 }
        }
      }
    });
  }