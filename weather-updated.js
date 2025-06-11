document.addEventListener('DOMContentLoaded', () => {
  // DOM cache
  const weatherSearchInput = document.querySelector('.location-search input');
  const weatherSearchButton = document.querySelector('.location-search button');
  const todayWeatherCard = document.querySelector('.today-weather .weather-details');
  const hourlyScroll = document.querySelector('.hourly-weather .hourly-scroll');
  const weeklyList = document.querySelector('.weekly-weather .weekly-list');
  const weatherResult = document.getElementById('weather-result');

  // Hero section elements
  const heroTemp = document.querySelector('#hero-temp');
  const heroCondition = document.querySelector('#hero-condition');
  const heroIcon = document.querySelector('#hero-icon');

  // Open-Meteo API configuration
  const openMeteoBaseUrl = "https://api.open-meteo.com/v1/forecast";
  const hourlyParams = "temperature_2m,weathercode";
  const dailyParams = "weathercode,temperature_2m_max,temperature_2m_min";

  function getWeatherEmoji(code) {
    // Updated for WMO weather codes (used by Open-Meteo)
    if ([0].includes(code)) return "☀️";       // Clear sky
    if ([1, 2, 3].includes(code)) return "⛅"; // Partly cloudy
    if ([45, 48].includes(code)) return "🌫️"; // Fog
    if ([51, 53, 55].includes(code)) return "🌧️"; // Drizzle
    if ([56, 57].includes(code)) return "🌨️"; // Freezing drizzle
    if ([61, 63, 65].includes(code)) return "🌧️"; // Rain
    if ([66, 67].includes(code)) return "🌨️"; // Freezing rain
    if ([71, 73, 75].includes(code)) return "❄️"; // Snow
    if ([77].includes(code)) return "🌨️";     // Snow grains
    if ([80, 81, 82].includes(code)) return "🌧️"; // Rain showers
    if ([85, 86].includes(code)) return "❄️"; // Snow showers
    if ([95, 96, 99].includes(code)) return "⛈️"; // Thunderstorm
    return "🌦️"; // Default
  }

  function getWeatherIconClass(code) {
    // Updated for WMO weather codes
    if ([0].includes(code)) return "fas fa-sun";
    if ([1, 2, 3].includes(code)) return "fas fa-cloud-sun";
    if ([45, 48].includes(code)) return "fas fa-smog";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "fas fa-cloud-rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "fas fa-snowflake";
    if ([95, 96, 99].includes(code)) return "fas fa-bolt";
    return "fas fa-cloud";
  }

  async function fetchWeatherByCity(city) {
    try {
      if (weatherResult) weatherResult.textContent = 'Loading weather data...';
      
      // Geocoding first to get coordinates
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }
      
      const { latitude, longitude } = geoData.results[0];
      fetchWeatherByCoords(latitude, longitude);
      
    } catch (err) {
      if (weatherResult) weatherResult.textContent = 'City not found or error fetching weather.';
      console.error(err);
    }
  }

  async function fetchWeatherByCoords(lat, lon) {
    try {
      if (weatherResult) weatherResult.textContent = 'Loading weather data...';
      
      const url = `${openMeteoBaseUrl}?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&current_weather=true&temperature_unit=celsius&timezone=auto`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      updateWeatherCards(data);
      updateHeroWeather(data);
      
      if (weatherResult) weatherResult.textContent = '';
    } catch (err) {
      if (weatherResult) weatherResult.textContent = 'Error fetching weather data.';
      console.error(err);
    }
  }

  function updateWeatherCards(data) {
    const current = data.current_weather;
    const daily = data.daily;
    const hourly = data.hourly;

    // Today's weather card
    todayWeatherCard.innerHTML = `
      <i class="${getWeatherIconClass(current.weathercode)}"></i>
      <div class="temp-range">
        <span class="max">${daily.temperature_2m_max[0]}°C</span>
        <span class="min">${daily.temperature_2m_min[0]}°C</span>
      </div>
      <div class="humidity">
        <i class="fas fa-tint"></i> N/A% <!-- Humidity not available in free tier -->
      </div>
      <div class="wind">
        <i class="fas fa-wind"></i> ${current.windspeed} km/h
      </div>
    `;

    // Hourly forecast
    hourlyScroll.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();
    
    // Display next 24 hours
    for (let i = currentHour; i < currentHour + 24; i++) {
      const hourElem = document.createElement('div');
      hourElem.className = 'hourly-item';
      
      // Format time (HH:MM)
      const hourIndex = i % 24;
      const displayTime = `${hourIndex.toString().padStart(2, '0')}:00`;
      
      hourElem.innerHTML = `
        <p>${displayTime}</p>
        <p>${getWeatherEmoji(hourly.weathercode[i])}</p>
        <p>${hourly.temperature_2m[i]}°C</p>
      `;
      hourlyScroll.appendChild(hourElem);
    }

    // Weekly forecast
    weeklyList.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const dayElem = document.createElement('div');
      dayElem.className = 'weekly-item';
      
      const date = new Date(daily.time[i]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      dayElem.innerHTML = `
        <p>${dayName}</p>
        <p>${getWeatherEmoji(daily.weathercode[i])}</p>
        <p>${daily.temperature_2m_max[i]}°C</p>
      `;
      weeklyList.appendChild(dayElem);
    }
  }

  function updateHeroWeather(data) {
    const current = data.current_weather;
    const temp = `${Math.round(current.temperature)}°C`;
    const iconClass = getWeatherIconClass(current.weathercode);

    if (heroTemp) heroTemp.textContent = temp;
    if (heroCondition) heroCondition.textContent = getWeatherConditionText(current.weathercode);
    if (heroIcon) heroIcon.className = iconClass;
  }

  function getWeatherConditionText(code) {
    // Map WMO codes to text descriptions
    const conditions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Severe thunderstorm"
    };
    return conditions[code] || "Unknown weather";
  }

  function getLocationAndFetchWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        error => {
          console.warn('Geolocation failed or denied, defaulting to Manila');
          fetchWeatherByCity('Manila');
        }
      );
    } else {
      console.warn('Geolocation not supported, defaulting to Manila');
      fetchWeatherByCity('Manila');
    }
  }

  if (weatherSearchButton) {
    weatherSearchButton.addEventListener('click', () => {
      const city = weatherSearchInput.value.trim();
      if (city) {
        fetchWeatherByCity(city);
      }
    });
  }

  if (weatherSearchInput) {
    weatherSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const city = weatherSearchInput.value.trim();
        if (city) {
          fetchWeatherByCity(city);
        }
      }
    });
  }

  // Initial load
  getLocationAndFetchWeather();
});

// Eco Tips Module with Open-Meteo Integration
document.addEventListener('DOMContentLoaded', () => {
  const tips = [
    "Bring your own bag when shopping to reduce plastic use.",
    "Use public transport or bike to reduce your carbon footprint.",
    "Switch off lights when not in use to save energy.",
    "Avoid fast fashion. Buy sustainable clothing.",
    "Compost your kitchen waste to reduce landfill trash."
  ];

  const weatherTips = {
    sunny: "With sunny weather forecasted, consider line-drying your clothes instead of using a dryer.",
    rainy: "It's raining! Use a rain barrel to collect water for your garden.",
    snow: "Snowy today? Insulate your home to conserve heat and save energy.",
    cloudy: "Cloudy skies? Great day for indoor energy-saving activities!",
    windy: "Windy weather? Secure lightweight items outdoors and reduce heating loss from drafts."
  };

  const products = [
    "Reusable Eco-bag",
    "Bamboo Toothbrush",
    "Stainless Steel Straw",
    "Solar Power Bank",
    "Compost Bin",
    "Reusable Food Wraps"
  ];

  const setEcoTips = () => {
    const dailyTipEl = document.getElementById('daily-tip');
    const weatherTipEl = document.getElementById('weather-tip');
    const productScrollEl = document.getElementById('product-scroll');

    if (!dailyTipEl || !weatherTipEl || !productScrollEl) return;

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    dailyTipEl.textContent = randomTip;

    products.forEach(product => {
      const div = document.createElement('div');
      div.className = 'product';
      div.textContent = product;
      productScrollEl.appendChild(div);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      weatherTipEl.textContent = "Can't get location — try enabling GPS.";
    }

    function success(position) {
      const { latitude, longitude } = position.coords;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const weatherCode = data.current_weather.weathercode;
          const windSpeed = data.current_weather.windspeed;
          
          let condition = "";
          
          // Determine condition based on weather code
          if ([0].includes(weatherCode)) {
            condition = "sunny";
          } 
          else if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(weatherCode)) {
            condition = "rainy";
          } 
          else if ([71,73,75,77,85,86].includes(weatherCode)) {
            condition = "snow";
          } 
          else if ([1,2,3,45,48].includes(weatherCode)) {
            condition = "cloudy";
          } 
          // Add windy condition based on wind speed
          else if (windSpeed > 20) {
            condition = "windy";
          }
          
          if (condition && weatherTips[condition]) {
            weatherTipEl.textContent = weatherTips[condition];
          } else {
            weatherTipEl.textContent = "Today's weather is great! Stay eco-conscious!";
          }
        })
        .catch(() => {
          weatherTipEl.textContent = "Unable to fetch weather data.";
        });
    }

    function error() {
      weatherTipEl.textContent = "Unable to access your location.";
    }
  };

  setEcoTips();
});