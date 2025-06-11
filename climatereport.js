// climateReport.js - Using Open-Meteo API

// The global-warming.org API for CO2 data does not require an API key
const CO2_API_URL = 'https://global-warming.org/api/co2-api';

// --- DOM Elements ---
const tempChartCanvas = document.getElementById('tempChart');
const co2ChartCanvas = document.getElementById('co2Chart');
const tempChangeSummary = document.getElementById('temp-change-summary');
const co2LevelDisplay = document.getElementById('co2-level');
const locationDisplay = document.getElementById('location-display');

// --- Chart Instances ---
let tempChart;
let co2Chart;

/**
 * Initializes the charts with placeholder data
 */
function initializeCharts() {
    // Temperature Chart
    tempChart = new Chart(tempChartCanvas, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#F44336',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#F44336',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperature (°C)' }
                },
                x: {
                    title: { display: true, text: 'Day of Week' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}°C`;
                        }
                    }
                }
            }
        }
    });

    // CO₂ Chart
    co2Chart = new Chart(co2ChartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CO₂ Levels (ppm)',
                data: [],
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
                borderColor: '#2E7D32',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2E7D32',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#2E7D32',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'CO₂ (ppm)' }
                },
                x: {
                    title: { display: true, text: 'Date' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} ppm`;
                        }
                    }
                }
            }
        }
    });

    co2LevelDisplay.textContent = 'Fetching CO₂ data...';
}

/**
 * Reverse geocodes coordinates to get location name
 */
async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        if (data.address) {
            const components = [];
            if (data.address.city) components.push(data.address.city);
            if (data.address.state) components.push(data.address.state);
            if (data.address.country) components.push(data.address.country);
            
            return components.join(', ') || "Unknown location";
        }
        return "Unknown location";
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return "Location not available";
    }
}

/**
 * Fetches weather forecast using Open-Meteo API
 */
async function fetchWeatherData(lat, lon) {
    // Set location immediately
    locationDisplay.textContent = `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    
    // Start reverse geocoding
    reverseGeocode(lat, lon).then(name => {
        locationDisplay.textContent = `Location: ${name}`;
    });

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean&timezone=auto&forecast_days=7`;

    try {
        tempChangeSummary.textContent = 'Fetching weather data...';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Open-Meteo Response:', data);

        // Extract daily temperatures and dates
        const dailyTemps = data.daily.temperature_2m_mean;
        const dateStrings = data.daily.time;

        // Convert dates to weekdays
        const dayLabels = dateStrings.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        // Update the temperature chart
        tempChart.data.labels = dayLabels;
        tempChart.data.datasets[0].data = dailyTemps;
        tempChart.update();

        // Calculate average temperature
        const avgTemp = dailyTemps.reduce((sum, temp) => sum + temp, 0) / dailyTemps.length;
        tempChangeSummary.textContent = `Average temperature this week: ${avgTemp.toFixed(1)}°C`;

    } catch (error) {
        console.error('Error fetching weather data:', error);
        tempChangeSummary.textContent = 'Failed to load weather data. ' + error.message;

        // Fallback to sample data
        tempChart.data.datasets[0].data = [12, 14, 16, 15, 17, 18, 16];
        tempChart.update();
        tempChangeSummary.textContent = 'Using sample data (API unavailable)';
    }
}

/**
 * Fetches global CO2 data
 */
async function fetchCo2Data() {
    try {
        co2LevelDisplay.textContent = 'Fetching global CO₂ data...';
        const response = await fetch(CO2_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data?.co2?.length > 0) {
            // Sort data by date
            data.co2.sort((a, b) => new Date(`${a.year}-${a.month}-${a.day}`) - new Date(`${b.year}-${b.month}-${b.day}`));

            // Get last 30 days of data
            const recentCo2Data = data.co2.slice(-30);
            const co2Labels = recentCo2Data.map(entry => `${entry.month}/${entry.day}`);
            const co2Values = recentCo2Data.map(entry => parseFloat(entry.cycle));

            // Get latest reading
            const latestEntry = data.co2[data.co2.length - 1];
            const latestValue = parseFloat(latestEntry.cycle);
            const latestDate = new Date(`${latestEntry.year}-${latestEntry.month}-${latestEntry.day}`)
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Update CO2 chart
            co2Chart.data.labels = co2Labels;
            co2Chart.data.datasets[0].data = co2Values;
            co2Chart.update();

            // Update CO2 display
            co2LevelDisplay.textContent = `Current: ${latestValue.toFixed(2)} ppm (as of ${latestDate})`;
        } else {
            co2LevelDisplay.textContent = 'No CO₂ data available';
        }

    } catch (error) {
        console.error('Error fetching CO2 data:', error);
        co2LevelDisplay.textContent = 'Failed to load CO₂ data';
    }
}

/**
 * Gets user's location and fetches weather data
 */
function getLocationAndFetchData() {
    if (navigator.geolocation) {
        tempChangeSummary.textContent = 'Getting your location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData(lat, lon);
            },
            (error) => {
                console.error('Geolocation error:', error);
                tempChangeSummary.textContent = 'Location access denied. Using default location.';
                locationDisplay.textContent = 'Location: London, England, UK';
                fetchWeatherData(51.5074, 0.1278); // London fallback
            }
        );
    } else {
        console.error('Geolocation not supported');
        tempChangeSummary.textContent = 'Geolocation not supported. Using default location.';
        locationDisplay.textContent = 'Location: London, England, UK';
        fetchWeatherData(51.5074, 0.1278); // London fallback
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    initializeCharts();
    getLocationAndFetchData();
    fetchCo2Data();
});

// Button event listeners
document.querySelector('.download-btn')?.addEventListener('click', () => {
    alert("Download functionality would be implemented here");
});

document.querySelector('.share-btn')?.addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'Climate Report',
            text: 'Check out this climate data!',
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Web Share API not supported");
    }
});