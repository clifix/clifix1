// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    mobileMenuBtn.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        mobileMenuBtn.innerHTML = navMenu.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
    
    // Smooth Scrolling for Navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if(navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
    
    // Initialize AQI Gauge
    initAqiGauge();
    
    // Initialize Charts
    initCharts();
    
// Option 1: Remove the import statement if unnecessary
// import { initWeatherApp } from './weather-updated.js';

console.log('Weather tracking active!');


    // Initialize new Weather App
    initWeatherApp();

    // Load AQI Trends
    loadAqiTrends();
    
    // Initialize CO2 Chart
    initCo2Chart();
    
    // Initialize Climate Tracker
    initClimateTracker();
    
    // Load Climate Impact Tracker (if logged in)
    if(false) { // Replace with actual login check
        document.querySelector('.login-prompt').style.display = 'none';
        document.querySelector('.tracker-login').style.display = 'block';
        loadClimateImpactData();
    }
    
    // Daily Eco Tip Rotator
    const tips = [
        "Use a reusable water bottle instead of buying plastic ones. You'll save money and reduce plastic waste!",
        "Turn off lights when leaving a room to save energy and reduce your electricity bill.",
        "Consider walking or biking for short trips instead of driving to reduce emissions.",
        "Start a compost bin for food scraps to reduce landfill waste and create nutrient-rich soil.",
        "Switch to LED light bulbs which use 75% less energy and last 25 times longer than incandescent bulbs."
    ];
    
    const weatherTips = {
        sunny: "With sunny weather forecasted, consider line-drying your clothes instead of using a dryer.",
        rainy: "Collect rainwater in barrels to water your plants and reduce water usage.",
        cold: "Lower your thermostat by a few degrees and wear warmer clothes to save energy.",
        hot: "Close blinds during the hottest part of the day to keep your home cooler naturally."
    };
    
    // Rotate tips daily
    const today = new Date().getDate();
    const dailyTip = document.querySelector('.tip-text');
    dailyTip.textContent = tips[today % tips.length];
    
    // Weather-based tip
    const weatherCondition = document.querySelector('.conditions span').textContent.toLowerCase();
    let weatherTip = weatherTips.sunny; // default
    
    if (weatherCondition.includes('rain')) {
        weatherTip = weatherTips.rainy;
    } else if (weatherCondition.includes('cold') || weatherCondition.includes('chilly')) {
        weatherTip = weatherTips.cold;
    } else if (weatherCondition.includes('hot') || weatherCondition.includes('warm')) {
        weatherTip = weatherTips.hot;
    }
    
    document.querySelector('.weather-based-tip p').textContent = weatherTip;
    
    // Mock products for eco tips
    const products = [
        { name: "Reusable Water Bottle", price: "$19.99", image: "product1.jpg" },
        { name: "Bamboo Toothbrush", price: "$4.99", image: "product2.jpg" },
        { name: "Solar Phone Charger", price: "$29.99", image: "product3.jpg" }
    ];
    
    const productContainer = document.querySelector('.product-scroll');
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.innerHTML = `
            <img src="images/${product.image}" alt="${product.name}">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price}</div>
            </div>
        `;
        productContainer.appendChild(productElement);
    });
    
    // Tree planting CTA
    document.querySelector('.tree-stats .cta-btn').addEventListener('click', function() {
        alert('Thank you for your interest in planting trees! In a real app, this would redirect to a tree planting donation page.');
    });
    
    // Download report button
    document.querySelector('.download-btn').addEventListener('click', function() {
        alert('In a real app, this would generate and download a PDF climate report.');
    });
    
    // Share report button
    document.querySelector('.share-btn').addEventListener('click', function() {
        alert('In a real app, this would open social media sharing options.');
    });
});

function initAqiGauge() {
    const canvas = document.getElementById('aqiGauge');
    const ctx = canvas.getContext('2d');
    
    // Gauge configuration
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const aqiValue = 45; // Current AQI value
    
    // Draw gauge background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#eee';
    ctx.stroke();
    
    // Calculate angle for current AQI (scale 0-300)
    const angle = 0.75 * Math.PI + (aqiValue / 300) * 1.5 * Math.PI;
    
    // Draw gauge value
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, angle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = getAqiColor(aqiValue);
    ctx.stroke();
    
    // Add center text
    ctx.font = '20px Poppins';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('AQI', centerX, centerY - 10);
    ctx.font = '24px Poppins bold';
    ctx.fillText(aqiValue, centerX, centerY + 25);
}

function getAqiColor(aqi) {
    if(aqi <= 50) return '#4CAF50'; // Good
    if(aqi <= 100) return '#FFC107'; // Moderate
    if(aqi <= 150) return '#FF9800'; // Unhealthy for sensitive
    if(aqi <= 200) return '#F44336'; // Unhealthy
    if(aqi <= 300) return '#9C27B0'; // Very unhealthy
    return '#795548'; // Hazardous
}

function initCharts() {
    // Temperature Chart
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [22, 24, 26, 25, 27, 28, 26],
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadAqiTrends() {
    const aqiTrendCtx = document.getElementById('aqiTrendChart').getContext('2d');
    new Chart(aqiTrendCtx, {
        type: 'line',
        data: {
            labels: ['3 Days Ago', '2 Days Ago', 'Yesterday', 'Today'],
            datasets: [{
                label: 'AQI',
                data: [65, 58, 52, 45],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 30,
                    max: 70
                }
            }
        }
    });
}

function initCo2Chart() {
    const co2Ctx = document.getElementById('co2Chart').getContext('2d');
    new Chart(co2Ctx, {
        type: 'bar',
        data: {
            labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
            datasets: [{
                label: 'CO₂ Levels (ppm)',
                data: [408, 410, 413, 415, 417, 419],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 400
                }
            }
        }
    });
}

// Initialize map (placeholder - in a real app you'd use Leaflet or Google Maps)
function initWeatherMap() {
    const mapContainer = document.querySelector('.map-container');
    mapContainer.innerHTML = '<div class="map-placeholder">Interactive Weather Map Would Appear Here</div>';
    
    // Layer switching
    document.querySelectorAll('.map-layers button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.map-layers button.active').classList.remove('active');
            this.classList.add('active');
            // In a real app, this would switch map layers
        });
    });
}

// Initialize tracker
function initClimateTracker() {
    if(document.querySelector('.tracker-login').style.display === 'block') {
        loadClimateImpactData();
    }
}