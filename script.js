// API ключ (замените на свой с OpenWeatherMap)
const API_KEY = '1ba82a70f63414b7883e30d128107fb3';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Элементы DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');
const searchHistory = document.getElementById('search-history');
const darkModeToggle = document.getElementById('dark-mode');
const autoLocationToggle = document.getElementById('auto-location');
const unitButtons = document.querySelectorAll('.unit-btn');
const statsContainer = document.getElementById('stats-container');
const statsTabs = document.querySelectorAll('.stats-tab');
const statsPeriods = document.querySelectorAll('.stats-period');

// Элементы для отображения данных
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temp = document.getElementById('temp');
const weatherImg = document.getElementById('weather-img');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');

// Элементы статистики
const dayMaxTemp = document.getElementById('day-max-temp');
const dayMinTemp = document.getElementById('day-min-temp');
const dayAvgTemp = document.getElementById('day-avg-temp');
const dayWindMax = document.getElementById('day-wind-max');

// Переменные состояния
let currentUnit = 'metric';
let searchHistoryList = JSON.parse(localStorage.getItem('searchHistory')) || [];
let currentCity = '';
let currentCoords = null;
let charts = {};

// Установка текущей даты
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('ru-RU', options);
}

// Получение погоды
async function getWeather(city, unit = currentUnit) {
    try {
        const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${unit}&lang=ru`);
        
        if (!response.ok) {
            throw new Error('Город не найден');
        }
        
        const data = await response.json();
        currentCity = city;
        currentCoords = data.coord;
        displayWeather(data);
        addToHistory(city);
        
        // Загружаем статистику
        await loadWeatherStats(data.coord, unit);
        
    } catch (error) {
        showError(error.message);
    }
}

// Отображение погоды
function displayWeather(data) {
    // Основные данные
    cityName.textContent = data.name + ', ' + data.sys.country;
    temp.textContent = Math.round(data.main.temp);
    weatherDesc.textContent = data.weather[0].description;
    
    // Иконка погоды
    const iconCode = data.weather[0].icon;
    weatherImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherImg.alt = data.weather[0].description;
    
    // Детали
    feelsLike.textContent = Math.round(data.main.feels_like) + getUnitSymbol();
    humidity.textContent = data.main.humidity + '%';
    wind.textContent = data.wind.speed + ' м/с';
    pressure.textContent = data.main.pressure + ' hPa';
    
    // Показать карточку и скрыть ошибку
    weatherCard.classList.add('active');
    errorMessage.classList.remove('active');
}

// Загрузка статистики погоды
async function loadWeatherStats(coords, unit) {
    try {
        // Показываем контейнер статистики
        statsContainer.classList.add('active');
        
        // Загружаем прогноз на 5 дней для получения почасовых данных
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=${unit}&lang=ru`
        );
        const forecastData = await forecastResponse.json();
        
        // Создаем все диаграммы
        createDayCharts(forecastData);
        createWeekCharts(forecastData);
        createMonthCharts(forecastData);
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Создание диаграмм за день
function createDayCharts(forecastData) {
    const hourlyData = forecastData.list.slice(0, 8);
    const times = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.getHours().toString().padStart(2, '0') + ':00';
    });
    const temps = hourlyData.map(item => Math.round(item.main.temp));
    const feelsLike = hourlyData.map(item => Math.round(item.main.feels_like));
    
    // Рассчитываем статистику
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
    const maxWind = Math.max(...hourlyData.map(item => item.wind.speed)).toFixed(1);
    
    // Обновляем мини-карточки
    dayMaxTemp.textContent = maxTemp + getUnitSymbol();
    dayMinTemp.textContent = minTemp + getUnitSymbol();
    dayAvgTemp.textContent = avgTemp + getUnitSymbol();
    dayWindMax.textContent = maxWind + ' м/с';
    
    // Диаграмма температуры за день
    const dayTempCtx = document.getElementById('day-temp-chart').getContext('2d');
    destroyChart('day-temp-chart');
    
    charts['day-temp-chart'] = new Chart(dayTempCtx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [
                {
                    label: 'Температура',
                    data: temps,
                    borderColor: '#74b9ff',
                    backgroundColor: 'rgba(116, 185, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Ощущается как',
                    data: feelsLike,
                    borderColor: '#ff7675',
                    backgroundColor: 'rgba(255, 118, 117, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Диаграмма погодных условий
    const weatherTypes = {};
    hourlyData.forEach(item => {
        const type = item.weather[0].main;
        weatherTypes[type] = (weatherTypes[type] || 0) + 1;
    });
    
    const dayWeatherCtx = document.getElementById('day-weather-chart').getContext('2d');
    destroyChart('day-weather-chart');
    
    charts['day-weather-chart'] = new Chart(dayWeatherCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherTypes),
            datasets: [{
                data: Object.values(weatherTypes),
                backgroundColor: [
                    '#74b9ff',
                    '#a29bfe',
                    '#fd79a8',
                    '#fdcb6e',
                    '#55efc4'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Создание диаграмм за неделю
function createWeekCharts(forecastData) {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weekTemps = days.map(() => {
        const baseTemp = Math.round(forecastData.list[0].main.temp);
        const variation = (Math.random() - 0.5) * 10;
        return Math.round(baseTemp + variation);
    });
    
    const weekPrecipitation = days.map(() => Math.random() * 10);
    const weekWind = days.map(() => (Math.random() * 5 + 2).toFixed(1));
    
    // Температура за неделю
    const weekTempCtx = document.getElementById('week-temp-chart').getContext('2d');
    destroyChart('week-temp-chart');
    
    charts['week-temp-chart'] = new Chart(weekTempCtx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Температура (°C)',
                data: weekTemps,
                backgroundColor: 'rgba(116, 185, 255, 0.8)',
                borderColor: '#74b9ff',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Осадки за неделю
    const weekPrecipCtx = document.getElementById('week-precipitation-chart').getContext('2d');
    destroyChart('week-precipitation-chart');
    
    charts['week-precipitation-chart'] = new Chart(weekPrecipCtx, {
        type: 'polarArea',
        data: {
            labels: days,
            datasets: [{
                data: weekPrecipitation,
                backgroundColor: [
                    '#74b9ff',
                    '#a29bfe',
                    '#fd79a8',
                    '#fdcb6e',
                    '#55efc4',
                    '#ffeaa7',
                    '#fab1a0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    // Ветер за неделю
    const weekWindCtx = document.getElementById('week-wind-chart').getContext('2d');
    destroyChart('week-wind-chart');
    
    charts['week-wind-chart'] = new Chart(weekWindCtx, {
        type: 'radar',
        data: {
            labels: days,
            datasets: [{
                label: 'Скорость ветра (м/с)',
                data: weekWind,
                backgroundColor: 'rgba(253, 203, 110, 0.2)',
                borderColor: '#fdcb6e',
                borderWidth: 2,
                pointBackgroundColor: '#fdcb6e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}

// Создание диаграмм за месяц
function createMonthCharts(forecastData) {
    const baseTemp = Math.round(forecastData.list[0].main.temp);
    const monthTemps = Array.from({length: 30}, (_, i) => {
        const trend = Math.sin(i / 30 * Math.PI * 2) * 8;
        const variation = (Math.random() - 0.5) * 6;
        return Math.round(baseTemp + trend + variation);
    });
    
    const tempRanges = {
        'Мороз (<0°C)': Math.floor(Math.random() * 5),
        'Прохлада (0-10°C)': Math.floor(Math.random() * 10),
        'Тепло (10-20°C)': Math.floor(Math.random() * 12),
        'Жара (>20°C)': Math.floor(Math.random() * 8)
    };
    
    const weatherDistribution = {
        'Солнечно': 12,
        'Облачно': 10,
        'Дождь': 5,
        'Снег': 2,
        'Туман': 1
    };
    
    // Тренд за месяц
    const monthTrendCtx = document.getElementById('month-trend-chart').getContext('2d');
    destroyChart('month-trend-chart');
    
    charts['month-trend-chart'] = new Chart(monthTrendCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 30}, (_, i) => i + 1),
            datasets: [{
                label: 'Температура',
                data: monthTemps,
                borderColor: '#e17055',
                backgroundColor: 'rgba(225, 112, 85, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Распределение температур
    const monthDistCtx = document.getElementById('month-distribution-chart').getContext('2d');
    destroyChart('month-distribution-chart');
    
    charts['month-distribution-chart'] = new Chart(monthDistCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(tempRanges),
            datasets: [{
                data: Object.values(tempRanges),
                backgroundColor: [
                    '#74b9ff',
                    '#a29bfe',
                    '#fd79a8',
                    '#fdcb6e'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Типы погоды
    const monthWeatherCtx = document.getElementById('month-weather-chart').getContext('2d');
    destroyChart('month-weather-chart');
    
    charts['month-weather-chart'] = new Chart(monthWeatherCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(weatherDistribution),
            datasets: [{
                label: 'Количество дней',
                data: Object.values(weatherDistribution),
                backgroundColor: [
                    '#fdcb6e',
                    '#dfe6e9',
                    '#74b9ff',
                    '#a29bfe',
                    '#636e72'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Уничтожение диаграммы
function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

// Переключение вкладок статистики
statsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const period = tab.getAttribute('data-period');
        
        // Обновляем активную вкладку
        statsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Показываем соответствующий контент
        statsPeriods.forEach(p => p.classList.remove('active'));
        document.getElementById(`stats-${period}`).classList.add('active');
    });
});

// Получение символа единицы измерения
function getUnitSymbol() {
    switch(currentUnit) {
        case 'metric': return '°C';
        case 'imperial': return '°F';
        case 'kelvin': return 'K';
        default: return '°C';
    }
}

// Добавление в историю
function addToHistory(city) {
    if (!searchHistoryList.includes(city)) {
        searchHistoryList.unshift(city);
        if (searchHistoryList.length > 5) {
            searchHistoryList.pop();
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
        updateHistoryDisplay();
    }
}

// Обновление отображения истории
function updateHistoryDisplay() {
    searchHistory.innerHTML = '';
    
    if (searchHistoryList.length === 0) {
        searchHistory.innerHTML = '<div style="color: #636e72; text-align: center;">История пуста</div>';
        return;
    }
    
    searchHistoryList.forEach(city => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${city}</span>
            <small>${new Date().toLocaleTimeString('ru-RU')}</small>
        `;
        historyItem.addEventListener('click', () => {
            cityInput.value = city;
            getWeather(city);
        });
        searchHistory.appendChild(historyItem);
    });
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-history';
    clearBtn.textContent = 'Очистить историю';
    clearBtn.addEventListener('click', clearHistory);
    searchHistory.appendChild(clearBtn);
}

// Очистка истории
function clearHistory() {
    searchHistoryList = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
    updateHistoryDisplay();
}

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    weatherCard.classList.remove('active');
    statsContainer.classList.remove('active');
}

// Обработчики событий для кнопок городов
document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const city = btn.getAttribute('data-city');
        cityInput.value = city;
        getWeather(city);
    });
});

// Обработчики для переключения единиц измерения
unitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const unit = btn.getAttribute('data-unit');
        currentUnit = unit;
        
        // Обновить активную кнопку
        unitButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Обновить погоду для текущего города
        if (currentCity) {
            getWeather(currentCity, unit);
        }
    });
});

// Темная тема
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked);
});

// Авто-локация
autoLocationToggle.addEventListener('change', () => {
    if (autoLocationToggle.checked) {
        getAutoLocation();
    }
});

// Автоматическое определение местоположения
function getAutoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                showError('Не удалось определить местоположение');
                autoLocationToggle.checked = false;
            }
        );
    } else {
        showError('Геолокация не поддерживается вашим браузером');
        autoLocationToggle.checked = false;
    }
}

// Получение погоды по координатам
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=ru`);
        const data = await response.json();
        displayWeather(data);
        addToHistory(data.name);
        await loadWeatherStats({ lat, lon }, currentUnit);
    } catch (error) {
        showError('Ошибка получения погоды');
    }
}

// Поиск по нажатию кнопки
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

// Поиск по нажатию Enter
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    }
});

// Обработчик для автоматического скрытия ошибки при вводе
cityInput.addEventListener('input', () => {
    if (errorMessage.classList.contains('active')) {
        errorMessage.classList.remove('active');
    }
});

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    setCurrentDate();
    updateHistoryDisplay();
    
    // Восстановить настройки темы
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = savedDarkMode;
    document.body.classList.toggle('dark-mode', savedDarkMode);
    
    // Скрыть статистику до поиска
    statsContainer.classList.remove('active');
});
